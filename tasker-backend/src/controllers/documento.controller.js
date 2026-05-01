const db = require("../config/db");
const { success, error } = require("../utils/response");

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

// POST /api/documentos — Subir documento (trabajador)
// Por ahora recibe una URL — en producción se integraría con S3/Cloudinary
const subirDocumento = async (req, res) => {
  const usuario_id = req.user.id;
  const { tipo, url } = req.body;

  try {
    if (!TIPOS_VALIDOS.includes(tipo))
      return error(res, `Tipo inválido. Debe ser: ${TIPOS_VALIDOS.join(", ")}`, 400);

    // Verificar que el usuario tiene perfil de trabajador
    const [trabajador] = await db.query(
      "SELECT id FROM trabajador WHERE usuario_id = ?",
      [usuario_id]
    );

    if (trabajador.length === 0)
      return error(res, "No tienes un perfil de trabajador", 400);

    const [result] = await db.query(
      `INSERT INTO documentos (trabajador_id, tipo, url, verificado)
       VALUES (?, ?, ?, 0)`,
      [usuario_id, tipo, url.trim()]
    );

    return success(res, { id: result.insertId, tipo, url, verificado: 0 },
      "Documento subido correctamente. Será revisado por un administrador.", 201);
  } catch (err) {
    console.error(err);
    return error(res, "Error al subir documento", 500);
  }
};

// DELETE /api/documentos/:id — Eliminar documento propio
const eliminarDocumento = async (req, res) => {
  const usuario_id = req.user.id;
  const { id } = req.params;

  try {
    const [doc] = await db.query(
      "SELECT id, verificado FROM documentos WHERE id = ? AND trabajador_id = ?",
      [id, usuario_id]
    );

    if (doc.length === 0)
      return error(res, "Documento no encontrado", 404);

    if (doc[0].verificado === 1)
      return error(res, "No puedes eliminar un documento ya verificado", 400);

    await db.query("DELETE FROM documentos WHERE id = ?", [id]);

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

module.exports = { getMisDocumentos, subirDocumento, eliminarDocumento, verificarDocumento };
