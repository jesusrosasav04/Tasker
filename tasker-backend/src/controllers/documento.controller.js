const fs = require("fs");
const db = require("../config/db");
const { success, error } = require("../utils/response");
const { rutaArchivo } = require("../middlewares/upload.middleware");

const TIPOS_VALIDOS = ["identificacion", "certificado", "titulo", "otro"];

// GET /api/documentos/mis-documentos — Ver mis documentos (trabajador)
const getMisDocumentos = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    const [docs] = await db.query(
      `SELECT id, tipo, url, verificado, created_at
       FROM documentos
       WHERE trabajador_id = ?
       ORDER BY created_at DESC`,
      [usuario_id]
    );

    return success(res, docs);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener documentos", 500);
  }
};

const borrarArchivo = (url) => {
  const abs = url && rutaArchivo(url);
  if (abs) fs.unlink(abs, () => {});
};

// POST /api/documentos — Subir documento (trabajador), multipart con campo "archivo"
// shortcut: se guarda en disco local (uploads/); en Railway el disco es efímero, migrar a S3/Cloudinary antes de producción
const subirDocumento = async (req, res) => {
  const usuario_id = req.user.id;
  const { tipo } = req.body;

  if (!req.file) return error(res, "Adjunta el archivo del documento", 400);
  const url = `documentos/${req.file.filename}`;

  try {
    if (!TIPOS_VALIDOS.includes(tipo)) {
      borrarArchivo(url);
      return error(res, `Tipo inválido. Debe ser: ${TIPOS_VALIDOS.join(", ")}`, 400);
    }

    // Verificar que el usuario tiene perfil de trabajador
    const [trabajador] = await db.query(
      "SELECT id FROM trabajador WHERE usuario_id = ?",
      [usuario_id]
    );

    if (trabajador.length === 0) {
      borrarArchivo(url);
      return error(res, "No tienes un perfil de trabajador", 400);
    }

    // documentos.trabajador_id tiene FK a usuarios(id) en la BD real, por eso se guarda usuario_id
    const [result] = await db.query(
      `INSERT INTO documentos (trabajador_id, tipo, url, verificado)
       VALUES (?, ?, ?, 0)`,
      [usuario_id, tipo, url]
    );

    return success(res, { id: result.insertId, tipo, url, verificado: 0, created_at: new Date() },
      "Documento subido correctamente. Será revisado por un administrador.", 201);
  } catch (err) {
    console.error(err);
    borrarArchivo(url);
    return error(res, "Error al subir documento", 500);
  }
};

// GET /api/documentos/:id/archivo — Descargar archivo (dueño o admin)
const getArchivo = async (req, res) => {
  const { id } = req.params;

  try {
    const [doc] = await db.query("SELECT trabajador_id, url FROM documentos WHERE id = ?", [id]);

    if (doc.length === 0 || (req.user.role !== "admin" && doc[0].trabajador_id !== req.user.id))
      return error(res, "Documento no encontrado", 404);

    const abs = rutaArchivo(doc[0].url);
    if (!abs || !fs.existsSync(abs)) return error(res, "El archivo ya no está disponible", 404);

    res.set("Cache-Control", "no-store");
    return res.sendFile(abs);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener el archivo", 500);
  }
};

// DELETE /api/documentos/:id — Eliminar documento propio
const eliminarDocumento = async (req, res) => {
  const usuario_id = req.user.id;
  const { id } = req.params;

  try {
    const [doc] = await db.query(
      "SELECT id, url, verificado FROM documentos WHERE id = ? AND trabajador_id = ?",
      [id, usuario_id]
    );

    if (doc.length === 0)
      return error(res, "Documento no encontrado", 404);

    if (doc[0].verificado === 1)
      return error(res, "No puedes eliminar un documento ya verificado", 400);

    await db.query("DELETE FROM documentos WHERE id = ?", [id]);
    borrarArchivo(doc[0].url);

    return success(res, null, "Documento eliminado correctamente");
  } catch (err) {
    console.error(err);
    return error(res, "Error al eliminar documento", 500);
  }
};

// PATCH /api/documentos/:id/verificar — Admin verifica documento
const verificarDocumento = async (req, res) => {
  const { id } = req.params;

  try {
    const [doc] = await db.query("SELECT id FROM documentos WHERE id = ?", [id]);

    if (doc.length === 0)
      return error(res, "Documento no encontrado", 404);

    await db.query("UPDATE documentos SET verificado = 1 WHERE id = ?", [id]);

    return success(res, null, "Documento verificado correctamente");
  } catch (err) {
    console.error(err);
    return error(res, "Error al verificar documento", 500);
  }
};

module.exports = { getMisDocumentos, subirDocumento, getArchivo, eliminarDocumento, verificarDocumento };
