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

const perfilRules = [
  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Descripción demasiado larga"),
  body("telefono")
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage("Teléfono inválido"),
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
