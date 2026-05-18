const db = require("../config/db");
const { success, error } = require("../utils/response");
const { encrypt, decrypt } = require("../config/encryption");

// POST /api/calificaciones
// Solo el cliente dueño de la tarea puede calificar, solo si está completada, solo una vez
const crearCalificacion = async (req, res) => {
  const cliente_id = req.user.id;
  const { tarea_id, puntuacion, comentario } = req.body;

  try {
    // Verificar que la tarea existe, pertenece al cliente y está completada
    const [tareas] = await db.query(
      `SELECT t.id, t.estado, t.cliente_id,
              p.trabajador_id AS trabajador_usuario_id,
              tr.id AS trabajador_id
       FROM tareas t
       JOIN postulaciones p ON p.tarea_id = t.id AND p.estado = 'aceptada'
       JOIN trabajador tr ON p.trabajador_id = tr.usuario_id
       WHERE t.id = ? AND t.cliente_id = ?`,
      [tarea_id, cliente_id]
    );

    if (tareas.length === 0)
      return error(res, "Tarea no encontrada o no tienes permiso para calificarla", 404);

    const tarea = tareas[0];

    if (tarea.estado !== "completada")
      return error(res, "Solo puedes calificar tareas completadas", 400);

    // Verificar que no haya calificado antes (UNIQUE KEY en tarea_id lo bloquea también)
    const [yaCalificada] = await db.query(
      "SELECT id FROM calificaciones WHERE tarea_id = ?",
      [tarea_id]
    );

    if (yaCalificada.length > 0)
      return error(res, "Ya calificaste esta tarea", 409);

    // Insertar calificación
    await db.query(
      `INSERT INTO calificaciones (tarea_id, cliente_id, trabajador_id, puntuacion, comentario)
       VALUES (?, ?, ?, ?, ?)`,
      [tarea_id, cliente_id, tarea.trabajador_usuario_id, puntuacion, comentario?.trim() ? encrypt(comentario.trim()) : null]
    );

    // Actualizar calificacion_promedio en la tabla trabajador
    await db.query(
      `UPDATE trabajador
       SET calificacion_promedio = (
         SELECT AVG(puntuacion) FROM calificaciones WHERE trabajador_id = ?
       )
       WHERE id = ?`,
      [tarea.trabajador_usuario_id, tarea.trabajador_id]
    );

    return success(res, null, "Calificación enviada correctamente", 201);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return error(res, "Ya calificaste esta tarea", 409);
    console.error(err);
    return error(res, "Error al enviar la calificación", 500);
  }
};

// GET /api/calificaciones/tarea/:id
// Verificar si el cliente ya calificó una tarea específica
const getCalificacionTarea = async (req, res) => {
  const cliente_id = req.user.id;
  const { tarea_id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT id, puntuacion, comentario, created_at
       FROM calificaciones
       WHERE tarea_id = ? AND cliente_id = ?`,
      [tarea_id, cliente_id]
    );

    return success(res, rows[0] ? { ...rows[0], comentario: decrypt(rows[0].comentario) } : null);
  } catch (err) {
    console.error(err);
    return error(res, "Error al verificar calificación", 500);
  }
};

module.exports = { crearCalificacion, getCalificacionTarea };
