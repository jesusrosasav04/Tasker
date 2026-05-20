const pool = require("../config/db");
const { success, error } = require("../utils/response");
const { crearNotificacion } = require("./notificacion.controller");

// POST /api/postulaciones — trabajador se postula a una tarea
const crearPostulacion = async (req, res) => {
  const trabajador_id = req.user.id;
  const { tarea_id, mensaje, precio_propuesto } = req.body;

  if (!tarea_id) {
    return error(res, "tarea_id es obligatorio", 400);
  }

  try {
    // Verificar que la tarea existe y está pendiente
    const [tareas] = await pool.query(
      `SELECT id, estado, cliente_id FROM tareas WHERE id = ?`,
      [tarea_id],
    );

    if (tareas.length === 0) {
      return error(res, "Tarea no encontrada", 404);
    }

    if (tareas[0].estado !== "pendiente") {
      return error(res, "La tarea ya no está disponible", 400);
    }

    // Evitar postulación duplicada
    const [existe] = await pool.query(
      `SELECT id FROM postulaciones WHERE tarea_id = ? AND trabajador_id = ?`,
      [tarea_id, trabajador_id],
    );

    if (existe.length > 0) {
      return error(res, "Ya te postulaste a esta tarea", 409);
    }

    const [result] = await pool.query(
      `INSERT INTO postulaciones (tarea_id, trabajador_id, mensaje, precio_propuesto, estado)
       VALUES (?, ?, ?, ?, 'pendiente')`,
      [tarea_id, trabajador_id, mensaje || null, precio_propuesto || null],
    );

    // Notificar al cliente
    const [trabajador] = await pool.query("SELECT nombre FROM usuarios WHERE id = ?", [trabajador_id]);
    crearNotificacion(tareas[0].cliente_id, `${trabajador[0]?.nombre} se postuló a tu tarea #${tarea_id}`);

    return success(
      res,
      { postulacion_id: result.insertId },
      "Postulación enviada",
      201,
    );
  } catch (err) {
    console.error(err);
    return error(res, "Error al crear postulación", 500);
  }
};

// GET /api/postulaciones/mis-postulaciones — trabajador ve sus postulaciones
const misPostulaciones = async (req, res) => {
  const trabajador_id = req.user.id;

  try {
    const [postulaciones] = await pool.query(
      `SELECT p.*, t.titulo, t.descripcion, t.presupuesto, t.estado AS tarea_estado,
              c.nombre AS categoria
       FROM postulaciones p
       JOIN tareas t ON p.tarea_id = t.id
       JOIN categorias c ON t.categoria_id = c.id
       WHERE p.trabajador_id = ?
       ORDER BY p.created_at DESC`,
      [trabajador_id],
    );

    return success(res, postulaciones);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener postulaciones", 500);
  }
};

// GET /api/postulaciones/tarea/:id — cliente ve quién se postuló a su tarea
const postulacionesPorTarea = async (req, res) => {
  const cliente_id = req.user.id;
  const { id: tarea_id } = req.params;

  try {
    // Verificar que la tarea pertenece al cliente
    const [tareas] = await pool.query(
      `SELECT id FROM tareas WHERE id = ? AND cliente_id = ?`,
      [tarea_id, cliente_id],
    );

    if (tareas.length === 0) {
      return error(res, "Tarea no encontrada o no autorizado", 404);
    }

    const [postulaciones] = await pool.query(
      `SELECT p.id, p.mensaje, p.precio_propuesto, p.estado, p.created_at,
              p.trabajador_id,
              u.nombre AS trabajador_nombre, u.email AS trabajador_email,
              tr.id AS trabajador_perfil_id, tr.descripcion AS trabajador_bio, tr.calificacion_promedio
       FROM postulaciones p
       JOIN usuarios u ON p.trabajador_id = u.id
       JOIN trabajador tr ON p.trabajador_id = tr.usuario_id
       WHERE p.tarea_id = ?
       ORDER BY p.created_at ASC`,
      [tarea_id],
    );

    return success(res, postulaciones);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener postulaciones", 500);
  }
};

// PATCH /api/postulaciones/:id/aceptar — cliente acepta una postulación
const aceptarPostulacion = async (req, res) => {
  const cliente_id = req.user.id;
  const { id: postulacion_id } = req.params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verificar que la postulación existe y pertenece a una tarea del cliente
    const [rows] = await conn.query(
      `SELECT p.id, p.tarea_id, p.trabajador_id, t.estado AS tarea_estado
       FROM postulaciones p
       JOIN tareas t ON p.tarea_id = t.id
       WHERE p.id = ? AND t.cliente_id = ?`,
      [postulacion_id, cliente_id],
    );

    if (rows.length === 0) {
      await conn.rollback();
      return error(res, "Postulación no encontrada o no autorizado", 404);
    }

    if (rows[0].tarea_estado !== "pendiente") {
      await conn.rollback();
      return error(res, "Esta tarea ya tiene un trabajador asignado", 400);
    }

    const { tarea_id, trabajador_id } = rows[0];

    // Aceptar esta postulación
    await conn.query(
      `UPDATE postulaciones SET estado = 'aceptada' WHERE id = ?`,
      [postulacion_id],
    );

    // Rechazar las demás postulaciones de la misma tarea
    await conn.query(
      `UPDATE postulaciones SET estado = 'rechazada'
       WHERE tarea_id = ? AND id != ?`,
      [tarea_id, postulacion_id],
    );

    // Cambiar estado de la tarea a 'en_progreso' y asignar trabajador
    await conn.query(
      `UPDATE tareas SET estado = 'en_progreso', trabajador_id = ? WHERE id = ?`,
      [trabajador_id, tarea_id],
    );

    await conn.commit();

    // Notificar al trabajador aceptado
    const [clienteInfo] = await pool.query("SELECT nombre FROM usuarios WHERE id = ?", [req.user.id]);
    crearNotificacion(trabajador_id, `¡Tu postulación fue aceptada! ${clienteInfo[0]?.nombre} te asignó la tarea #${tarea_id}`);

    return success(res, null, "Postulación aceptada, tarea en progreso");
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return error(res, "Error al aceptar postulación", 500);
  } finally {
    conn.release();
  }
};

module.exports = {
  crearPostulacion,
  misPostulaciones,
  postulacionesPorTarea,
  aceptarPostulacion,
};
