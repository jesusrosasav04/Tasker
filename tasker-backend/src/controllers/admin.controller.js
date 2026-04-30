const db = require("../config/db");
const { success, error } = require("../utils/response");

// GET /api/admin/usuarios
const getUsuarios = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  try {
    const [usuarios] = await db.query(
      `SELECT
        u.id, u.nombre, u.email, u.telefono,
        u.estado, u.created_at,
        r.nombre AS role
       FROM usuarios u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM usuarios`,
    );

    return success(res, { usuarios, total, page, limit });
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener usuarios", 500);
  }
};

// PATCH /api/admin/usuarios/:id/estado
const toggleEstadoUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const [usuario] = await db.query(
      `SELECT id, estado, nombre FROM usuarios WHERE id = ?`,
      [id],
    );

    if (usuario.length === 0) return error(res, "Usuario no encontrado", 404);

    if (parseInt(id) === req.user.id)
      return error(res, "No puedes desactivarte a ti mismo", 400);

    const nuevoEstado = usuario[0].estado === 1 ? 0 : 1;

    await db.query(`UPDATE usuarios SET estado = ? WHERE id = ?`, [
      nuevoEstado,
      id,
    ]);

    const mensaje =
      nuevoEstado === 1 ? "Usuario activado" : "Usuario desactivado";
    return success(res, { estado: nuevoEstado }, mensaje);
  } catch (err) {
    console.error(err);
    return error(res, "Error al cambiar estado del usuario", 500);
  }
};

// GET /api/admin/trabajadores/pendientes
const getTrabajadoresPendientes = async (req, res) => {
  try {
    const [trabajadores] = await db.query(
      `SELECT
        t.id AS trabajador_id,
        t.descripcion,
        t.verificado,
        u.created_at,
        u.id AS usuario_id,
        u.nombre,
        u.email,
        u.telefono,
        GROUP_CONCAT(DISTINCT c.nombre SEPARATOR ', ') AS categorias
       FROM trabajador t
       JOIN usuarios u ON t.usuario_id = u.id
       LEFT JOIN trabajador_categorias tc ON t.id = tc.trabajador_id
       LEFT JOIN categorias c ON tc.categoria_id = c.id
       WHERE t.verificado = 0 AND u.estado = 1
       GROUP BY t.id
       ORDER BY u.created_at ASC`,
    );

    return success(res, trabajadores);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener trabajadores pendientes", 500);
  }
};

// PATCH /api/admin/trabajadores/:id/verificar
const verificarTrabajador = async (req, res) => {
  const { id } = req.params;
  const { accion } = req.body;

  if (!["aprobar", "rechazar"].includes(accion))
    return error(res, 'Acción inválida. Usa: "aprobar" o "rechazar"', 400);

  try {
    const [trabajador] = await db.query(
      `SELECT id FROM trabajador WHERE id = ?`,
      [id],
    );

    if (trabajador.length === 0)
      return error(res, "Trabajador no encontrado", 404);

    if (accion === "aprobar") {
      await db.query(`UPDATE trabajador SET verificado = 1 WHERE id = ?`, [id]);
      return success(res, null, "Trabajador verificado correctamente");
    } else {
      await db.query(
        `UPDATE usuarios u
         JOIN trabajador t ON t.usuario_id = u.id
         SET u.estado = 0
         WHERE t.id = ?`,
        [id],
      );
      return success(res, null, "Trabajador rechazado");
    }
  } catch (err) {
    console.error(err);
    return error(res, "Error al verificar trabajador", 500);
  }
};

// GET /api/admin/tareas
const getTareas = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  const { estado } = req.query;

  try {
    let query = `
      SELECT
        t.id, t.titulo, t.descripcion, t.presupuesto,
        t.ubicacion, t.estado, t.created_at,
        c.nombre AS categoria,
        u.nombre AS cliente_nombre
       FROM tareas t
       JOIN categorias c ON t.categoria_id = c.id
       JOIN usuarios u ON t.cliente_id = u.id
    `;

    const params = [];

    if (estado) {
      query += ` WHERE t.estado = ?`;
      params.push(estado);
    }

    query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [tareas] = await db.query(query, params);

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM tareas ${estado ? "WHERE estado = ?" : ""}`,
      estado ? [estado] : [],
    );

    return success(res, { tareas, total, page, limit });
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener tareas", 500);
  }
};

// GET /api/admin/estadisticas
const getEstadisticas = async (req, res) => {
  try {
    const [[{ total_usuarios }]] = await db.query(
      `SELECT COUNT(*) AS total_usuarios FROM usuarios WHERE estado = 1`,
    );

    const [[{ total_clientes }]] = await db.query(
      `SELECT COUNT(*) AS total_clientes FROM usuarios u
       JOIN roles r ON u.role_id = r.id
       WHERE r.nombre = 'cliente' AND u.estado = 1`,
    );

    const [[{ total_trabajadores }]] = await db.query(
      `SELECT COUNT(*) AS total_trabajadores FROM trabajador WHERE verificado = 1`,
    );

    const [[{ total_tareas }]] = await db.query(
      `SELECT COUNT(*) AS total_tareas FROM tareas`,
    );

    const [[{ tareas_pendientes }]] = await db.query(
      `SELECT COUNT(*) AS tareas_pendientes FROM tareas WHERE estado = 'pendiente'`,
    );

    const [[{ tareas_completadas }]] = await db.query(
      `SELECT COUNT(*) AS tareas_completadas FROM tareas WHERE estado = 'completada'`,
    );

    const [[{ trabajadores_pendientes }]] = await db.query(
      `SELECT COUNT(*) AS trabajadores_pendientes FROM trabajador WHERE verificado = 0`,
    );

    return success(res, {
      usuarios: {
        total: total_usuarios,
        clientes: total_clientes,
        trabajadores: total_trabajadores,
      },
      tareas: {
        total: total_tareas,
        pendientes: tareas_pendientes,
        completadas: tareas_completadas,
      },
      trabajadores_por_verificar: trabajadores_pendientes,
    });
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener estadísticas", 500);
  }
};

module.exports = {
  getUsuarioDetalle,
  getUsuarios,
  toggleEstadoUsuario,
  getTrabajadoresPendientes,
  verificarTrabajador,
  getTareas,
  getEstadisticas,
};

// GET /api/admin/usuarios/:id
const getUsuarioDetalle = async (req, res) => {
  const { id } = req.params;

  try {
    // Info base del usuario
    const [usuarios] = await db.query(
      `SELECT
        u.id, u.nombre, u.email, u.telefono,
        u.estado, u.created_at, u.google_id,
        r.nombre AS role
       FROM usuarios u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [id]
    );

    if (usuarios.length === 0)
      return error(res, "Usuario no encontrado", 404);

    const usuario = usuarios[0];

    // Si es trabajador, traer datos del perfil
    let perfilTrabajador = null;
    if (usuario.role === "trabajador") {
      const [trabajador] = await db.query(
        `SELECT
          t.id AS trabajador_id,
          t.descripcion,
          t.verificado,
          t.calificacion_promedio,
          GROUP_CONCAT(DISTINCT c.nombre SEPARATOR ', ') AS categorias
         FROM trabajador t
         LEFT JOIN trabajador_categorias tc ON t.id = tc.trabajador_id
         LEFT JOIN categorias c ON tc.categoria_id = c.id
         WHERE t.usuario_id = ?
         GROUP BY t.id`,
        [id]
      );
      perfilTrabajador = trabajador[0] || null;
    }

    // Historial de tareas (como cliente)
    const [tareasCliente] = await db.query(
      `SELECT
        t.id, t.titulo, t.estado, t.created_at,
        c.nombre AS categoria
       FROM tareas t
       JOIN categorias c ON t.categoria_id = c.id
       WHERE t.cliente_id = ?
       ORDER BY t.created_at DESC
       LIMIT 10`,
      [id]
    );

    // Historial de postulaciones (como trabajador)
    let postulaciones = [];
    if (usuario.role === "trabajador") {
      const [trab] = await db.query(
        "SELECT id FROM trabajador WHERE usuario_id = ?", [id]
      );
      if (trab.length > 0) {
        const [posts] = await db.query(
          `SELECT
            p.id, p.estado AS postulacion_estado,
            p.precio_propuesto, p.created_at,
            t.titulo, t.estado AS tarea_estado
           FROM postulaciones p
           JOIN tareas t ON p.tarea_id = t.id
           WHERE p.trabajador_id = ?
           ORDER BY p.created_at DESC
           LIMIT 10`,
          [trab[0].id]
        );
        postulaciones = posts;
      }
    }

    // Estadísticas rápidas
    const [[{ total_tareas }]] = await db.query(
      "SELECT COUNT(*) AS total_tareas FROM tareas WHERE cliente_id = ?", [id]
    );
    const [[{ tareas_completadas }]] = await db.query(
      "SELECT COUNT(*) AS tareas_completadas FROM tareas WHERE cliente_id = ? AND estado = 'completada'", [id]
    );

    return success(res, {
      usuario,
      perfil_trabajador: perfilTrabajador,
      tareas_cliente: tareasCliente,
      postulaciones,
      stats: {
        total_tareas,
        tareas_completadas,
      },
    });
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener detalle del usuario", 500);
  }
};

module.exports = {
  getUsuarios,
  toggleEstadoUsuario,
  getTrabajadoresPendientes,
  verificarTrabajador,
  getTareas,
  getEstadisticas,
  getUsuarioDetalle,
};
