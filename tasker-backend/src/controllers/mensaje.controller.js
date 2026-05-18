const db = require("../config/db");
const { success, error } = require("../utils/response");
const { encrypt, decrypt } = require("../config/encryption");

// GET /api/mensajes/:tarea_id — Obtener mensajes de una tarea
const getMensajes = async (req, res) => {
  const usuario_id = req.user.id;
  const { tarea_id } = req.params;

  try {
    // Verificar que el usuario es parte de esta tarea (cliente o trabajador)
    const [acceso] = await db.query(
      `SELECT t.id FROM tareas t
       LEFT JOIN postulaciones p ON p.tarea_id = t.id AND p.estado = 'aceptada'
       LEFT JOIN trabajador tr ON p.trabajador_id = tr.usuario_id
       WHERE t.id = ? AND (t.cliente_id = ? OR tr.usuario_id = ?)
       LIMIT 1`,
      [tarea_id, usuario_id, usuario_id]
    );

    if (acceso.length === 0)
      return error(res, "No tienes acceso a los mensajes de esta tarea", 403);

    const [mensajes] = await db.query(
      `SELECT
        m.id, m.mensaje, m.leido, m.created_at,
        m.remitente_id,
        u.nombre AS remitente_nombre
       FROM mensajes m
       JOIN usuarios u ON m.remitente_id = u.id
       WHERE m.tarea_id = ?
       ORDER BY m.created_at ASC`,
      [tarea_id]
    );

    // Marcar como leídos los mensajes recibidos por este usuario
    await db.query(
      `UPDATE mensajes SET leido = 1
       WHERE tarea_id = ? AND receptor_id = ? AND leido = 0`,
      [tarea_id, usuario_id]
    );

    // Descifrar mensajes antes de enviar al cliente
    const mensajesDescifrados = mensajes.map((m) => ({
      ...m,
      mensaje: decrypt(m.mensaje),
    }));

    return success(res, mensajesDescifrados);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener mensajes", 500);
  }
};

// POST /api/mensajes — Enviar mensaje
const enviarMensaje = async (req, res) => {
  const remitente_id = req.user.id;
  const { tarea_id, mensaje } = req.body;

  try {
    // Verificar acceso y obtener el otro participante
    const [tarea] = await db.query(
      `SELECT t.cliente_id, tr.usuario_id AS trabajador_usuario_id
       FROM tareas t
       LEFT JOIN postulaciones p ON p.tarea_id = t.id AND p.estado = 'aceptada'
       LEFT JOIN trabajador tr ON p.trabajador_id = tr.usuario_id
       WHERE t.id = ?`,
      [tarea_id]
    );

    if (tarea.length === 0)
      return error(res, "Tarea no encontrada", 404);

    const { cliente_id, trabajador_usuario_id } = tarea[0];

    // Verificar que el remitente es parte de esta tarea
    if (remitente_id !== cliente_id && remitente_id !== trabajador_usuario_id)
      return error(res, "No tienes acceso a esta tarea", 403);

    if (!trabajador_usuario_id)
      return error(res, "Esta tarea aún no tiene un trabajador asignado", 400);

    // El receptor es el otro participante
    const receptor_id = remitente_id === cliente_id ? trabajador_usuario_id : cliente_id;

    const [result] = await db.query(
      `INSERT INTO mensajes (tarea_id, remitente_id, receptor_id, mensaje)
       VALUES (?, ?, ?, ?)`,
      [tarea_id, remitente_id, receptor_id, encrypt(mensaje.trim())]
    );

    // Crear notificación para el receptor
    await db.query(
      `INSERT INTO notificaciones (usuario_id, mensaje)
       VALUES (?, ?)`,
      [receptor_id, `Nuevo mensaje en la tarea #${tarea_id}`]
    ).catch(() => {}); // No fallar si notificaciones falla

    return success(res, {
      id: result.insertId,
      tarea_id,
      remitente_id,
      receptor_id,
      mensaje: mensaje.trim(),
      leido: 0,
    }, "Mensaje enviado", 201);
  } catch (err) {
    console.error(err);
    return error(res, "Error al enviar mensaje", 500);
  }
};

// GET /api/mensajes/no-leidos — Contador de mensajes no leídos
const noLeidos = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM mensajes
       WHERE receptor_id = ? AND leido = 0`,
      [usuario_id]
    );

    return success(res, { total });
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener mensajes no leídos", 500);
  }
};

module.exports = { getMensajes, enviarMensaje, noLeidos };
