const router = require("express").Router();
const {
  getAll,
  getById,
  actualizarPerfil,
  misTareas,
  misCalificaciones,
} = require("../controllers/trabajador.controller");
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { body, param } = require("express-validator");
const { normalizarTelefono, normalizarCurp, curpValida, MSG_TELEFONO, MSG_CURP } = require("../utils/identidad");

const perfilRules = [
  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Descripción demasiado larga"),
  body("telefono")
    .optional({ values: "falsy" })
    .custom((v) => normalizarTelefono(v) !== null)
    .withMessage(MSG_TELEFONO),
  body("curp")
    .optional({ values: "falsy" })
    .custom((v) => curpValida(normalizarCurp(v)))
    .withMessage(MSG_CURP),
];

const idParamRule = [param("id").isInt({ min: 1 }).withMessage("ID inválido")];

// ─── Rutas estáticas primero ───────────────────────────────
router.get("/mis-tareas", verifyToken, verifyRole("trabajador"), misTareas);

router.get(
  "/mis-calificaciones",
  verifyToken,
  verifyRole("trabajador"),
  misCalificaciones,
);

router.put(
  "/perfil",
  verifyToken,
  verifyRole("trabajador"),
  perfilRules,
  validate,
  actualizarPerfil,
);

// ─── Rutas públicas ────────────────────────────────────────
router.get("/", getAll);

// ─── Ruta con parámetro al final siempre ──────────────────
router.get("/:id", idParamRule, validate, getById);

module.exports = router;
