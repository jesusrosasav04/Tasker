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

module.exports = { getAll, getById };
