const router = require("express").Router();
const {
  getUsuarios,
  toggleEstadoUsuario,
  getTrabajadoresPendientes,
  verificarTrabajador,
  getTareas,
  getEstadisticas,
} = require("../controllers/admin.controller");
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

// Todas las rutas requieren token y rol admin
router.use(verifyToken, verifyRole("admin"));

const idParamRule = [param("id").isInt({ min: 1 }).withMessage("ID inválido")];

const verificarRules = [
  body("accion")
    .isIn(["aprobar", "rechazar"])
    .withMessage('Acción inválida. Usa: "aprobar" o "rechazar"'),
];

router.get("/usuarios", getUsuarios);
router.patch(
  "/usuarios/:id/estado",
  idParamRule,
  validate,
  toggleEstadoUsuario,
);
router.get("/trabajadores/pendientes", getTrabajadoresPendientes);
router.patch(
  "/trabajadores/:id/verificar",
  idParamRule,
  verificarRules,
  validate,
  verificarTrabajador,
);
router.get("/tareas", getTareas);
router.get("/estadisticas", getEstadisticas);

module.exports = router;
