const db = require("../config/db");
const { success, error } = require("../utils/response");

// GET /api/notificaciones — Mis notificaciones
const getMisNotificaciones = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    const [notificaciones] = await db.query(
      `SELECT id, mensaje, leido, created_at
       FROM notificaciones
       WHERE usuario_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [usuario_id]
    );

    return success(res, notificaciones);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener notificaciones", 500);
  }
};

// GET /api/notificaciones/no-leidas — Contador
const noLeidas = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM notificaciones
       WHERE usuario_id = ? AND leido = 0`,
      [usuario_id]
    );

    return success(res, { total });
  } catch (err) {
    console.error(err);
    return error(res, "Error al contar notificaciones", 500);
  }
};

// PATCH /api/notificaciones/:id/leer — Marcar una como leída
const marcarLeida = async (req, res) => {
  const usuario_id = req.user.id;
  const { id } = req.params;

  try {
    await db.query(
      `UPDATE notificaciones SET leido = 1
       WHERE id = ? AND usuario_id = ?`,
      [id, usuario_id]
    );

    return success(res, null, "Notificación marcada como leída");
  } catch (err) {
    console.error(err);
    return error(res, "Error al marcar notificación", 500);
  }
};

// PATCH /api/notificaciones/leer-todas — Marcar todas como leídas
const marcarTodasLeidas = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    await db.query(
      `UPDATE notificaciones SET leido = 1
       WHERE usuario_id = ? AND leido = 0`,
      [usuario_id]
    );

    return success(res, null, "Todas las notificaciones marcadas como leídas");
  } catch (err) {
    console.error(err);
    return error(res, "Error al marcar notificaciones", 500);
  }
};

// Helper exportado para crear notificaciones desde otros controllers
const crearNotificacion = async (usuario_id, mensaje) => {
  try {
    await db.query(
      `INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?)`,
      [usuario_id, mensaje]
    );
  } catch (err) {
    console.error("Error al crear notificación:", err);
  }
};

module.exports = {
  getMisNotificaciones,
  noLeidas,
  marcarLeida,
  marcarTodasLeidas,
  crearNotificacion,
};
