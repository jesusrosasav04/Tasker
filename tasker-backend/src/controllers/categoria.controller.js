const db = require("../config/db");
const { success, error } = require("../utils/response");

// GET /api/categorias — públicas (solo activas)
const getAll = async (req, res) => {
  try {
    const [categorias] = await db.query(
      "SELECT id, nombre FROM categorias WHERE activo = 1 ORDER BY nombre"
    );
    return success(res, categorias);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener categorías", 500);
  }
};

// GET /api/admin/categorias — admin (todas, activas e inactivas)
const getAllAdmin = async (req, res) => {
  try {
    const [categorias] = await db.query(
      `SELECT
        id, nombre, activo,
        (SELECT COUNT(*) FROM tareas WHERE categoria_id = categorias.id) AS total_tareas
       FROM categorias
       ORDER BY nombre`
    );
    return success(res, categorias);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener categorías", 500);
  }
};

// POST /api/admin/categorias
const crear = async (req, res) => {
  const { nombre } = req.body;

  try {
    const [existe] = await db.query(
      "SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(?)",
      [nombre.trim()]
    );

    if (existe.length > 0)
      return error(res, "Ya existe una categoría con ese nombre", 409);

    const [result] = await db.query(
      "INSERT INTO categorias (nombre, activo) VALUES (?, 1)",
      [nombre.trim()]
    );

    const [nueva] = await db.query(
      "SELECT * FROM categorias WHERE id = ?",
      [result.insertId]
    );

    return success(res, nueva[0], "Categoría creada correctamente", 201);
  } catch (err) {
    console.error(err);
    return error(res, "Error al crear categoría", 500);
  }
};

// PUT /api/admin/categorias/:id
const actualizar = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  try {
    const [existe] = await db.query(
      "SELECT id FROM categorias WHERE id = ?",
      [id]
    );

    if (existe.length === 0)
      return error(res, "Categoría no encontrada", 404);

    if (nombre) {
      const [duplicado] = await db.query(
        "SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(?) AND id != ?",
        [nombre.trim(), id]
      );
      if (duplicado.length > 0)
        return error(res, "Ya existe una categoría con ese nombre", 409);
    }

    await db.query(
      "UPDATE categorias SET nombre = COALESCE(?, nombre) WHERE id = ?",
      [nombre?.trim() || null, id]
    );

    const [actualizada] = await db.query(
      "SELECT * FROM categorias WHERE id = ?",
      [id]
    );

    return success(res, actualizada[0], "Categoría actualizada correctamente");
  } catch (err) {
    console.error(err);
    return error(res, "Error al actualizar categoría", 500);
  }
};

// PATCH /api/admin/categorias/:id/estado — activar/desactivar
const toggleEstado = async (req, res) => {
  const { id } = req.params;

  try {
    const [categoria] = await db.query(
      "SELECT id, nombre, activo FROM categorias WHERE id = ?",
      [id]
    );

    if (categoria.length === 0)
      return error(res, "Categoría no encontrada", 404);

    if (categoria[0].activo === 1) {
      const [[{ total }]] = await db.query(
        "SELECT COUNT(*) AS total FROM tareas WHERE categoria_id = ? AND estado NOT IN ('completada', 'cancelada')",
        [id]
      );
      if (total > 0)
        return error(
          res,
          `No puedes desactivar esta categoría, tiene ${total} tarea(s) activa(s)`,
          400
        );
    }

    const nuevoEstado = categoria[0].activo === 1 ? 0 : 1;
    await db.query("UPDATE categorias SET activo = ? WHERE id = ?", [nuevoEstado, id]);

    const mensaje = nuevoEstado === 1 ? "Categoría activada" : "Categoría desactivada";
    return success(res, { activo: nuevoEstado }, mensaje);
  } catch (err) {
    console.error(err);
    return error(res, "Error al cambiar estado de la categoría", 500);
  }
};

// DELETE /api/admin/categorias/:id
const eliminar = async (req, res) => {
  const { id } = req.params;

  try {
    const [categoria] = await db.query(
      "SELECT id FROM categorias WHERE id = ?",
      [id]
    );

    if (categoria.length === 0)
      return error(res, "Categoría no encontrada", 404);

    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM tareas WHERE categoria_id = ?",
      [id]
    );

    if (total > 0)
      return error(
        res,
        `No puedes eliminar esta categoría, tiene ${total} tarea(s) asociada(s). Desactívala en su lugar.`,
        400
      );

    await db.query("DELETE FROM categorias WHERE id = ?", [id]);
    return success(res, null, "Categoría eliminada correctamente");
  } catch (err) {
    console.error(err);
    return error(res, "Error al eliminar categoría", 500);
  }
};

module.exports = { getAll, getAllAdmin, crear, actualizar, toggleEstado, eliminar };
