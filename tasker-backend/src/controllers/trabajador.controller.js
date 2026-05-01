const db = require("../config/db");
const { success, error } = require("../utils/response");

// GET /api/trabajadores
const getAll = async (req, res) => {
  try {
    const { categoria, nombre } = req.query;

    let query = `
      SELECT
        t.id AS trabajador_id,
        t.descripcion,
        t.verificado,
        u.id AS usuario_id,
        u.nombre,
        u.telefono,
        t.calificacion_promedio,
        GROUP_CONCAT(DISTINCT c.nombre SEPARATOR ', ') AS categorias
      FROM trabajador t
      JOIN usuarios u ON t.usuario_id = u.id
      LEFT JOIN trabajador_categorias tc ON t.id = tc.trabajador_id
      LEFT JOIN categorias c ON tc.categoria_id = c.id
      WHERE u.estado = 1 AND t.verificado = 1
    `;

    const params = [];

    if (nombre) {
      query += ` AND u.nombre LIKE ?`;
      params.push(`%${nombre}%`);
    }

    if (categoria) {
      query += ` AND c.id = ?`;
      params.push(categoria);
    }

    query += ` GROUP BY t.id ORDER BY t.calificacion_promedio DESC`;

    const [trabajadores] = await db.query(query, params);
    return success(res, trabajadores);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener trabajadores", 500);
  }
};

// GET /api/trabajadores/:id
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT
        t.id AS trabajador_id,
        t.descripcion,
        t.verificado,
        t.calificacion_promedio,
        u.id AS usuario_id,
        u.nombre,
        u.email,
        u.telefono,
        u.created_at,
        GROUP_CONCAT(DISTINCT c.nombre SEPARATOR ', ') AS categorias
      FROM trabajador t
      JOIN usuarios u ON t.usuario_id = u.id
      LEFT JOIN trabajador_categorias tc ON t.id = tc.trabajador_id
      LEFT JOIN categorias c ON tc.categoria_id = c.id
      WHERE t.id = ? AND u.estado = 1
      GROUP BY t.id`,
      [id],
    );

    if (rows.length === 0) return error(res, "Trabajador no encontrado", 404);

    const [resenas] = await db.query(
      `SELECT
        cal.puntuacion,
        cal.comentario,
        cal.created_at,
        u.nombre AS cliente_nombre
      FROM calificaciones cal
      JOIN usuarios u ON cal.cliente_id = u.id
      WHERE cal.trabajador_id = ?
      ORDER BY cal.created_at DESC
      LIMIT 5`,
      [rows[0].usuario_id],
    );

    return success(res, { ...rows[0], resenas });
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener trabajador", 500);
  }
};

// PUT /api/trabajadores/perfil 🔒 (solo trabajador)
const actualizarPerfil = async (req, res) => {
  const usuario_id = req.user.id;
  const { descripcion, telefono, categorias } = req.body;

  try {
    const [trab] = await db.query("SELECT id FROM trabajador WHERE usuario_id = ?", [usuario_id]);
    if (trab.length === 0) return error(res, "Perfil de trabajador no encontrado", 404);
    const trabajador_id = trab[0].id;

    await db.query("UPDATE trabajador SET descripcion = ? WHERE usuario_id = ?", [descripcion || null, usuario_id]);

    if (telefono) {
      await db.query("UPDATE usuarios SET telefono = ? WHERE id = ?", [telefono, usuario_id]);
    }

    // Actualizar categorías si se enviaron
    if (Array.isArray(categorias)) {
      await db.query("DELETE FROM trabajador_categorias WHERE trabajador_id = ?", [trabajador_id]);
      if (categorias.length > 0) {
        const values = categorias.map((cat_id) => [trabajador_id, cat_id]);
        await db.query("INSERT IGNORE INTO trabajador_categorias (trabajador_id, categoria_id) VALUES ?", [values]);
      }
    }

    return success(res, null, "Perfil actualizado correctamente", 200);
  } catch (err) {
    console.error(err);
    return error(res, "Error al actualizar perfil", 500);
  }
};

// GET /api/trabajadores/mis-tareas 🔒 (solo trabajador)
const misTareas = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    // tareas.trabajador_id guarda directamente el usuario_id del trabajador asignado
    const [tareas] = await db.query(
      `SELECT
        t.id, t.titulo, t.descripcion, t.presupuesto,
        t.ubicacion, t.latitud, t.longitud,
        t.estado, t.created_at,
        c.nombre AS categoria,
        u.nombre AS cliente_nombre,
        p.precio_propuesto
       FROM tareas t
       JOIN categorias c ON t.categoria_id = c.id
       JOIN usuarios u ON t.cliente_id = u.id
       LEFT JOIN postulaciones p ON p.tarea_id = t.id
         AND p.trabajador_id = ? AND p.estado = 'aceptada'
       WHERE t.trabajador_id = ?
       ORDER BY t.created_at DESC`,
      [usuario_id, usuario_id],
    );

    return success(res, tareas);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener tareas", 500);
  }
};

// GET /api/trabajadores/mis-calificaciones 🔒 (solo trabajador)
const misCalificaciones = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    const [calificaciones] = await db.query(
      `SELECT
        cal.puntuacion,
        cal.comentario,
        cal.created_at,
        u.nombre AS cliente_nombre,
        t.titulo AS tarea
       FROM calificaciones cal
       JOIN usuarios u ON cal.cliente_id = u.id
       JOIN tareas t ON cal.tarea_id = t.id
       WHERE cal.trabajador_id = ?
       ORDER BY cal.created_at DESC`,
      [usuario_id],
    );

    return success(res, calificaciones);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener calificaciones", 500);
  }
};

module.exports = {
  getAll,
  getById,
  actualizarPerfil,
  misTareas,
  misCalificaciones,
};
