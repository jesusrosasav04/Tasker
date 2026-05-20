const pool = require("../config/db");
const { success, error } = require("../utils/response");

// POST /api/tareas — cliente crea una tarea
const crearTarea = async (req, res) => {
  const {
    titulo,
    descripcion,
    categoria_id,
    presupuesto,
    ubicacion,
    latitud,
    longitud,
  } = req.body;
  const cliente_id = req.user.id;

  // Validaciones
  if (!titulo || !descripcion || !categoria_id) {
    return error(res, "Título, descripción y categoría son obligatorios", 400);
  }

  if (titulo.trim().length < 5) {
    return error(res, "El título debe tener al menos 5 caracteres", 400);
  }

  if (
    presupuesto !== undefined &&
    presupuesto !== null &&
    (isNaN(presupuesto) || presupuesto < 0)
  ) {
    return error(res, "El presupuesto debe ser un número positivo", 400);
  }

  // Validar coordenadas si se envían (deben ir juntas)
  const tieneLatitud = latitud !== undefined && latitud !== null;
  const tieneLongitud = longitud !== undefined && longitud !== null;

  if (tieneLatitud !== tieneLongitud) {
    return error(res, "Debes enviar latitud y longitud juntas", 400);
  }

  if (tieneLatitud) {
    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);
    if (isNaN(lat) || lat < -90 || lat > 90)
      return error(res, "Latitud inválida", 400);
    if (isNaN(lng) || lng < -180 || lng > 180)
      return error(res, "Longitud inválida", 400);
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO tareas 
         (cliente_id, categoria_id, titulo, descripcion, presupuesto, ubicacion, latitud, longitud, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
      [
        cliente_id,
        categoria_id,
        titulo.trim(),
        descripcion.trim(),
        presupuesto || null,
        ubicacion || null,
        tieneLatitud ? parseFloat(latitud) : null,
        tieneLongitud ? parseFloat(longitud) : null,
      ],
    );

    return success(
      res,
      { tarea_id: result.insertId },
      "Tarea creada exitosamente",
      201,
    );
  } catch (err) {
    console.error(err);
    return error(res, "Error al crear la tarea", 500);
  }
};

// GET /api/tareas/mis-tareas — tareas del cliente autenticado
const misTareas = async (req, res) => {
  const cliente_id = req.user.id;

  try {
    const [tareas] = await pool.query(
      `SELECT 
         t.id, t.titulo, t.descripcion, t.presupuesto,
         t.ubicacion, t.latitud, t.longitud,
         t.estado, t.created_at, t.updated_at,
         c.nombre AS categoria
       FROM tareas t
       JOIN categorias c ON t.categoria_id = c.id
       WHERE t.cliente_id = ?
       ORDER BY t.created_at DESC`,
      [cliente_id],
    );

    return success(res, tareas);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener tareas", 500);
  }
};

// GET /api/tareas/disponibles — feed para trabajadores
const tareasDisponibles = async (req, res) => {
  // Paginación opcional: ?page=1&limit=20
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20); // máximo 50 por página
  const offset = (page - 1) * limit;

  try {
    const [tareas] = await pool.query(
      `SELECT 
         t.id, t.titulo, t.descripcion, t.presupuesto,
         t.ubicacion, t.latitud, t.longitud,
         t.estado, t.created_at,
         c.nombre AS categoria,
         u.nombre AS cliente_nombre
       FROM tareas t
       JOIN categorias c ON t.categoria_id = c.id
       JOIN usuarios u ON t.cliente_id = u.id
       WHERE t.estado = 'pendiente'
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    return success(res, { tareas, page, limit });
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener tareas disponibles", 500);
  }
};

// PATCH /api/tareas/:id/completar 🔒 (cliente dueño)
const completarTarea = async (req, res) => {
  const cliente_id = req.user.id;
  const { id } = req.params;

  try {
    const [tareas] = await pool.query(
      "SELECT id, estado, cliente_id FROM tareas WHERE id = ? AND cliente_id = ?",
      [id, cliente_id]
    );

    if (tareas.length === 0)
      return error(res, "Tarea no encontrada o no tienes permiso", 404);

    if (tareas[0].estado !== "en_progreso")
      return error(res, "Solo puedes completar tareas en progreso", 400);

    await pool.query("UPDATE tareas SET estado = 'completada' WHERE id = ?", [id]);

    return success(res, null, "Tarea marcada como completada");
  } catch (err) {
    console.error(err);
    return error(res, "Error al completar la tarea", 500);
  }
};

// GET /api/tareas/:id — Detalle completo de una tarea
const getTareaById = async (req, res) => {
  const usuario_id = req.user.id;
  const { id }     = req.params;

  try {
    const [tareas] = await pool.query(
      `SELECT
        t.id, t.titulo, t.descripcion, t.presupuesto,
        t.ubicacion, t.latitud, t.longitud,
        t.estado, t.created_at,
        c.nombre AS categoria,
        u.id AS cliente_id, u.nombre AS cliente_nombre, u.email AS cliente_email,
        u.telefono AS cliente_telefono
       FROM tareas t
       JOIN categorias c ON t.categoria_id = c.id
       JOIN usuarios u ON t.cliente_id = u.id
       WHERE t.id = ?`,
      [id]
    );

    if (tareas.length === 0)
      return error(res, "Tarea no encontrada", 404);

    const tarea = tareas[0];

    // Verificar que el usuario tiene acceso (cliente dueño o trabajador asignado)
    // tareas.trabajador_id guarda directamente el usuario_id del trabajador
    const [acceso] = await pool.query(
      `SELECT 1 FROM tareas
       WHERE id = ? AND (cliente_id = ? OR trabajador_id = ?)
       LIMIT 1`,
      [id, usuario_id, usuario_id]
    );

    if (acceso.length === 0)
      return error(res, "No tienes acceso a esta tarea", 403);

    // Trabajador asignado (si hay)
    // postulaciones.trabajador_id = usuarios.id directamente
    const [trabajadorAsignado] = await pool.query(
      `SELECT
        u.id, u.nombre, u.email,
        tr.calificacion_promedio,
        p.precio_propuesto, p.mensaje
       FROM postulaciones p
       JOIN usuarios u ON p.trabajador_id = u.id
       LEFT JOIN trabajador tr ON tr.usuario_id = u.id
       WHERE p.tarea_id = ? AND p.estado = 'aceptada'
       LIMIT 1`,
      [id]
    );

    // Calificación de esta tarea (si ya fue calificada)
    const [calificacion] = await pool.query(
      "SELECT puntuacion, comentario FROM calificaciones WHERE tarea_id = ? LIMIT 1",
      [id]
    );

    return success(res, {
      ...tarea,
      trabajador: trabajadorAsignado[0] || null,
      calificacion: calificacion[0] || null,
    });
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener la tarea", 500);
  }
};


// PUT /api/tareas/:id — cliente edita su tarea (solo si está pendiente)
const actualizarTarea = async (req, res) => {
  const cliente_id = req.user.id;
  const { id } = req.params;
  const { titulo, descripcion, categoria_id, presupuesto, ubicacion, latitud, longitud } = req.body;

  try {
    const [tareas] = await pool.query(
      "SELECT id, estado, cliente_id FROM tareas WHERE id = ? AND cliente_id = ?",
      [id, cliente_id]
    );

    if (tareas.length === 0)
      return error(res, "Tarea no encontrada o no tienes permiso", 404);

    if (tareas[0].estado !== "pendiente")
      return error(res, "Solo puedes editar tareas que aún no han sido aceptadas", 400);

    await pool.query(
      `UPDATE tareas SET
        titulo       = COALESCE(?, titulo),
        descripcion  = COALESCE(?, descripcion),
        categoria_id = COALESCE(?, categoria_id),
        presupuesto  = COALESCE(?, presupuesto),
        ubicacion    = COALESCE(?, ubicacion),
        latitud      = COALESCE(?, latitud),
        longitud     = COALESCE(?, longitud)
       WHERE id = ?`,
      [
        titulo?.trim()      || null,
        descripcion?.trim() || null,
        categoria_id        || null,
        presupuesto         || null,
        ubicacion?.trim()   || null,
        latitud             || null,
        longitud            || null,
        id,
      ]
    );

    const [actualizada] = await pool.query(
      `SELECT t.id, t.titulo, t.descripcion, t.presupuesto,
              t.ubicacion, t.latitud, t.longitud, t.estado,
              c.nombre AS categoria
       FROM tareas t JOIN categorias c ON t.categoria_id = c.id
       WHERE t.id = ?`,
      [id]
    );

    return success(res, actualizada[0], "Tarea actualizada correctamente");
  } catch (err) {
    console.error(err);
    return error(res, "Error al actualizar la tarea", 500);
  }
};

module.exports = { crearTarea, misTareas, tareasDisponibles, completarTarea, getTareaById, actualizarTarea };
