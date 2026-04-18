const db = require("../config/db");
const { success, error } = require("../utils/response");

// GET /api/trabajadores
const getAll = async (req, res) => {
  try {
    const { categoria, nombre } = req.query;

    let query = `
      SELECT
        t.TrabajadorID,
        t.biografia,
        t.estadoVerificado,
        t.estadoOnline,
        u.nombre,
        u.apellidoP,
        u.FotoPerfilURL,
        u.telefono,
        GROUP_CONCAT(c.nombre SEPARATOR ', ') AS categorias,
        ROUND(AVG(cal.Puntuacion), 1)          AS calificacion,
        COUNT(DISTINCT cal.CalificacionID)      AS total_resenas,
        COUNT(DISTINCT ta.TareaID)              AS total_trabajos
      FROM trabajador t
      JOIN usuarios u ON t.UsuarioID = u.UsuarioID
      LEFT JOIN trabajador_categorias tc ON t.TrabajadorID = tc.TrabajadorID
      LEFT JOIN categorias c             ON tc.CategoriaID = c.CategoriaID
      LEFT JOIN tareas ta                ON t.TrabajadorID = ta.TrabajadorID
                                         AND ta.Estado = 'completada'
      LEFT JOIN calificaciones cal       ON u.UsuarioID = cal.CalificadoID
      WHERE u.estado = 1 AND t.estadoVerificado = 1
    `;

    const params = [];

    if (nombre) {
      query += ` AND (u.nombre LIKE ? OR u.apellidoP LIKE ?)`;
      params.push(`%${nombre}%`, `%${nombre}%`);
    }

    if (categoria) {
      query += ` AND c.CategoriaID = ?`;
      params.push(categoria);
    }

    query += ` GROUP BY t.TrabajadorID ORDER BY calificacion DESC`;

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
      `
      SELECT
        t.TrabajadorID,
        t.biografia,
        t.estadoVerificado,
        t.estadoOnline,
        u.UsuarioID,
        u.nombre,
        u.apellidoP,
        u.apellidoM,
        u.FotoPerfilURL,
        u.telefono,
        u.FechaRegistro,
        GROUP_CONCAT(DISTINCT c.nombre SEPARATOR ', ') AS categorias,
        ROUND(AVG(cal.Puntuacion), 1)                  AS calificacion,
        COUNT(DISTINCT cal.CalificacionID)              AS total_resenas,
        COUNT(DISTINCT ta.TareaID)                      AS total_trabajos
      FROM trabajador t
      JOIN usuarios u ON t.UsuarioID = u.UsuarioID
      LEFT JOIN trabajador_categorias tc ON t.TrabajadorID = tc.TrabajadorID
      LEFT JOIN categorias c             ON tc.CategoriaID = c.CategoriaID
      LEFT JOIN tareas ta                ON t.TrabajadorID = ta.TrabajadorID
                                         AND ta.Estado = 'completada'
      LEFT JOIN calificaciones cal       ON u.UsuarioID = cal.CalificadoID
      WHERE t.TrabajadorID = ? AND u.estado = 1
      GROUP BY t.TrabajadorID
    `,
      [id],
    );

    if (rows.length === 0) return error(res, "Trabajador no encontrado", 404);

    // Reseñas recientes
    const [resenas] = await db.query(
      `
      SELECT
        cal.Puntuacion,
        cal.Comentario,
        cal.FechaCreacion,
        u.nombre AS cliente_nombre
      FROM calificaciones cal
      JOIN usuarios u ON cal.CalificadorID = u.UsuarioID
      WHERE cal.CalificadoID = ?
      ORDER BY cal.FechaCreacion DESC
      LIMIT 5
    `,
      [rows[0].UsuarioID],
    );

    return success(res, { ...rows[0], resenas });
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener trabajador", 500);
  }
};

module.exports = { getAll, getById };
