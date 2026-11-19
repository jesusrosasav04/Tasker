const router = require("express").Router();
const {
  getUsuarios,
  toggleEstadoUsuario,
  getTrabajadoresPendientes,
  verificarTrabajador,
  getTareas,
  getEstadisticas,
  getUsuarioDetalle,
  getTareaDetalle,
  eliminarTarea,
  cambiarEstadoTarea,
  cancelarTareaAdmin,
} = require("../controllers/admin.controller");
const {
  getAllAdmin,
  crear,
  actualizar,
  toggleEstado,
  eliminar,
} = require("../controllers/categoria.controller");
const { getReportesAdmin, actualizarReporte } = require("../controllers/reporte.controller");
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

// Todas las rutas requieren token y rol admin
router.use(verifyToken, verifyRole("admin"));

// ── Reglas de validación ──────────────────────────────
const idParamRule = [param("id").isInt({ min: 1 }).withMessage("ID inválido")];

const verificarRules = [
  body("accion")
    .isIn(["aprobar", "rechazar"])
    .withMessage('Acción inválida. Usa: "aprobar" o "rechazar"'),
];

const categoriaRules = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres"),
];

const categoriaUpdateRules = [
  body("nombre")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres"),
];

// ── Usuarios ──────────────────────────────────────────
router.get("/usuarios", getUsuarios);
router.get("/usuarios/:id", idParamRule, validate, getUsuarioDetalle);
router.patch("/usuarios/:id/estado", idParamRule, validate, toggleEstadoUsuario);

// ── Trabajadores ──────────────────────────────────────
router.get("/trabajadores/pendientes", getTrabajadoresPendientes);
router.patch(
  "/trabajadores/:id/verificar",
  idParamRule,
  verificarRules,
  validate,
  verificarTrabajador
);

const estadoTareaRules = [
  body("estado")
    .isIn(["pendiente", "en_progreso", "completada", "cancelada"])
    .withMessage("Estado inválido"),
];

// ── Tareas ────────────────────────────────────────────
router.get("/tareas", getTareas);
router.get("/tareas/:id", idParamRule, validate, getTareaDetalle);
router.patch("/tareas/:id/estado", idParamRule, estadoTareaRules, validate, cambiarEstadoTarea);
router.delete("/tareas/:id", idParamRule, validate, eliminarTarea);

// ── Estadísticas ──────────────────────────────────────
router.get("/estadisticas", getEstadisticas);

// ── Categorías ────────────────────────────────────────
router.get("/categorias", getAllAdmin);
router.post("/categorias", categoriaRules, validate, crear);
router.put("/categorias/:id", idParamRule, categoriaUpdateRules, validate, actualizar);
router.patch("/categorias/:id/estado", idParamRule, validate, toggleEstado);
router.delete("/categorias/:id", idParamRule, validate, eliminar);

// ── Reportes ──────────────────────────────────────────
const reporteRules = [
  body("estado").isIn(["pendiente", "revisado", "resuelto"]).withMessage("Estado inválido"),
  body("resolucion").optional().trim().isLength({ max: 2000 }),
  body("tarea_estado").optional().isIn(["completada", "cancelada"]).withMessage("Estado de tarea inválido"),
];
const reporteFiltros = [
  query("estado").optional().isIn(["pendiente", "revisado", "resuelto"]),
  query("tipo").optional().isIn(["bug", "pago", "usuario", "servicio", "otro"]),
];
router.get("/reportes", reporteFiltros, validate, getReportesAdmin);
router.patch("/reportes/:id", idParamRule, reporteRules, validate, actualizarReporte);
router.patch("/tareas/:id/cancelar", idParamRule, validate, cancelarTareaAdmin);

module.exports = router;
