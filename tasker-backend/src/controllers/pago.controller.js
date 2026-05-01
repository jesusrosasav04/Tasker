const db = require("../config/db");
const { success, error } = require("../utils/response");
const { crearNotificacion } = require("./notificacion.controller");

// GET /api/pagos/metodos — Listar métodos de pago disponibles
const getMetodos = async (req, res) => {
  try {
    const [metodos] = await db.query("SELECT id, nombre FROM metodos_pago ORDER BY id");
    return success(res, metodos);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener métodos de pago", 500);
  }
};

// POST /api/pagos — Registrar pago de una tarea
const registrarPago = async (req, res) => {
  const cliente_id = req.user.id;
  const { tarea_id, metodo_pago_id, monto, referencia } = req.body;

  try {
    // Verificar que la tarea pertenece al cliente y está completada o en_progreso
    const [tareas] = await db.query(
      `SELECT t.id, t.estado, t.cliente_id,
              p.trabajador_id AS trabajador_usuario_id
       FROM tareas t
       JOIN postulaciones p ON p.tarea_id = t.id AND p.estado = 'aceptada'
       WHERE t.id = ? AND t.cliente_id = ?`,
      [tarea_id, cliente_id]
    );

    if (tareas.length === 0)
      return error(res, "Tarea no encontrada o no tienes permiso", 404);

    if (!["en_progreso", "completada"].includes(tareas[0].estado))
      return error(res, "Solo puedes registrar pagos de tareas en progreso o completadas", 400);

    // Verificar que no existe ya un pago para esta tarea
    const [pagoExiste] = await db.query(
      "SELECT id FROM pagos WHERE tarea_id = ? AND estado = 'completado'",
      [tarea_id]
    );

    if (pagoExiste.length > 0)
      return error(res, "Esta tarea ya tiene un pago registrado", 409);

    // Verificar que el método de pago existe
    const [metodo] = await db.query(
      "SELECT id, nombre FROM metodos_pago WHERE id = ?",
      [metodo_pago_id]
    );

    if (metodo.length === 0)
      return error(res, "Método de pago inválido", 400);

    const [result] = await db.query(
      `INSERT INTO pagos (tarea_id, cliente_id, trabajador_id, metodo_pago_id, monto, estado, referencia)
       VALUES (?, ?, ?, ?, ?, 'completado', ?)`,
      [tarea_id, cliente_id, tareas[0].trabajador_usuario_id, metodo_pago_id, monto, referencia?.trim() || null]
    );

    // Notificar al trabajador
    crearNotificacion(
      tareas[0].trabajador_usuario_id,
      `Se registró un pago de $${monto} por la tarea #${tarea_id} vía ${metodo[0].nombre}`
    );

    return success(res, { pago_id: result.insertId }, "Pago registrado correctamente", 201);
  } catch (err) {
    console.error(err);
    return error(res, "Error al registrar pago", 500);
  }
};

// GET /api/pagos/tarea/:tarea_id — Ver pago de una tarea
const getPagoTarea = async (req, res) => {
  const usuario_id = req.user.id;
  const { tarea_id } = req.params;

  try {
    const [pagos] = await db.query(
      `SELECT
        p.id, p.monto, p.estado, p.referencia, p.created_at,
        mp.nombre AS metodo_pago,
        uc.nombre AS cliente_nombre,
        ut.nombre AS trabajador_nombre
       FROM pagos p
       JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
       JOIN usuarios uc ON p.cliente_id = uc.id
       JOIN usuarios ut ON p.trabajador_id = ut.id
       WHERE p.tarea_id = ? AND (p.cliente_id = ? OR p.trabajador_id = ?)`,
      [tarea_id, usuario_id, usuario_id]
    );

    return success(res, pagos[0] || null);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener pago", 500);
  }
};

// GET /api/pagos/mis-pagos — Historial de pagos del cliente
const getMisPagos = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    const [pagos] = await db.query(
      `SELECT
        p.id, p.monto, p.estado, p.created_at,
        mp.nombre AS metodo_pago,
        t.titulo AS tarea,
        u.nombre AS trabajador_nombre
       FROM pagos p
       JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
       JOIN tareas t ON p.tarea_id = t.id
       JOIN usuarios u ON p.trabajador_id = u.id
       WHERE p.cliente_id = ?
       ORDER BY p.created_at DESC`,
      [usuario_id]
    );

    return success(res, pagos);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener pagos", 500);
  }
};

module.exports = { getMetodos, registrarPago, getPagoTarea, getMisPagos };
