const pool = require("../config/db");
const { success, error } = require("../utils/response");
const { POSTULACIONES_GRATIS } = require("../config/creditos");

// Serie de los últimos 6 meses con huecos en 0 (para la gráfica)
function serieMensual(filas, campo) {
  const mapa = Object.fromEntries(filas.map((f) => [f.mes, Number(f[campo]) || 0]));
  const serie = [];
  const hoy = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    serie.push({ mes, valor: mapa[mes] || 0 });
  }
  return serie;
}

async function statsCliente(usuarioId) {
  const [porEstado] = await pool.query(
    "SELECT estado, COUNT(*) AS n FROM tareas WHERE cliente_id = ? GROUP BY estado",
    [usuarioId],
  );
  const [[gasto]] = await pool.query(
    "SELECT COALESCE(SUM(monto), 0) AS total, COUNT(*) AS pagos FROM pagos WHERE cliente_id = ? AND estado = 'completado'",
    [usuarioId],
  );
  const [categorias] = await pool.query(
    `SELECT c.nombre, COUNT(*) AS n
     FROM tareas t JOIN categorias c ON c.id = t.categoria_id
     WHERE t.cliente_id = ?
     GROUP BY c.nombre ORDER BY n DESC LIMIT 3`,
    [usuarioId],
  );
  const [mensual] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS mes, COUNT(*) AS n
     FROM tareas
     WHERE cliente_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY mes`,
    [usuarioId],
  );

  const estados = Object.fromEntries(porEstado.map((r) => [r.estado, Number(r.n)]));
  const total = Object.values(estados).reduce((a, b) => a + b, 0);
  const totalGasto = Number(gasto.total);

  return {
    rol: "cliente",
    tareas: { total, ...estados },
    gasto_total: totalGasto,
    gasto_promedio: gasto.pagos > 0 ? totalGasto / gasto.pagos : 0,
    pagos_registrados: Number(gasto.pagos),
    categorias_top: categorias.map((c) => ({ nombre: c.nombre, n: Number(c.n) })),
    serie: { titulo: "Tareas publicadas por mes", unidad: "tareas", datos: serieMensual(mensual, "n") },
  };
}

async function statsTrabajador(usuarioId) {
  const [porEstado] = await pool.query(
    "SELECT estado, COUNT(*) AS n FROM postulaciones WHERE trabajador_id = ? GROUP BY estado",
    [usuarioId],
  );
  const [[trabajos]] = await pool.query(
    "SELECT COUNT(*) AS n FROM tareas WHERE trabajador_id = ? AND estado = 'completada'",
    [usuarioId],
  );
  const [[ingresos]] = await pool.query(
    "SELECT COALESCE(SUM(monto), 0) AS total FROM pagos WHERE trabajador_id = ? AND estado = 'completado'",
    [usuarioId],
  );
  const [[calif]] = await pool.query(
    "SELECT COUNT(*) AS n, AVG(puntuacion) AS promedio FROM calificaciones WHERE trabajador_id = ?",
    [usuarioId],
  );
  const [[perfil]] = await pool.query(
    "SELECT plan, creditos FROM trabajador WHERE usuario_id = ?",
    [usuarioId],
  );
  const [mensual] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS mes, SUM(monto) AS total
     FROM pagos
     WHERE trabajador_id = ? AND estado = 'completado'
       AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY mes`,
    [usuarioId],
  );

  const post = Object.fromEntries(porEstado.map((r) => [r.estado, Number(r.n)]));
  const totalPost = Object.values(post).reduce((a, b) => a + b, 0);
  const aceptadas = post.aceptada || 0;

  return {
    rol: "trabajador",
    postulaciones: { total: totalPost, ...post },
    tasa_exito: totalPost > 0 ? Math.round((aceptadas / totalPost) * 100) : 0,
    trabajos_completados: Number(trabajos.n),
    ingresos_total: Number(ingresos.total),
    calificaciones: Number(calif.n),
    calificacion_promedio: calif.promedio ? Number(Number(calif.promedio).toFixed(1)) : null,
    plan: perfil?.plan || "freemium",
    creditos: perfil?.creditos ?? 0,
    gratis_restantes: Math.max(0, POSTULACIONES_GRATIS - totalPost),
    serie: { titulo: "Ingresos por mes", unidad: "MXN", datos: serieMensual(mensual, "total") },
  };
}

// GET /api/estadisticas — resumen según el rol del usuario
const misEstadisticas = async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role === "cliente") return success(res, await statsCliente(id));
    if (role === "trabajador") return success(res, await statsTrabajador(id));
    return error(res, "Las estadísticas del admin están en el panel de administración", 400);
  } catch (err) {
    console.error("Error estadísticas:", err);
    return error(res, "No se pudieron calcular tus estadísticas", 500);
  }
};

module.exports = { misEstadisticas };
