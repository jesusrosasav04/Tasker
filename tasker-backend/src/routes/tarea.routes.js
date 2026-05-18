const router = require("express").Router();
const {
  crearTarea,
  misTareas,
  tareasDisponibles,
  completarTarea,
  getTareaById,
} = require("../controllers/tarea.controller");
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { body, param } = require("express-validator");

const tareaRules = [
  body("titulo")
    .trim()
    .notEmpty()
    .withMessage("El título es obligatorio")
    .isLength({ min: 5, max: 150 })
    .withMessage("El título debe tener entre 5 y 150 caracteres"),
  body("descripcion")
    .trim()
    .notEmpty()
    .withMessage("La descripción es obligatoria")
    .isLength({ max: 2000 })
    .withMessage("La descripción no puede superar 2000 caracteres"),
  body("categoria_id").isInt({ min: 1 }).withMessage("Categoría inválida"),
  body("presupuesto")
    .optional()
    .isFloat({ min: 1, max: 9999999 })
    .withMessage("Presupuesto inválido"),
  body("ubicacion")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Ubicación demasiado larga"),
  body("latitud")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitud inválida"),
  body("longitud")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitud inválida"),
];

router.post("/", verifyToken, verifyRole("cliente"), tareaRules, validate, crearTarea);
router.get("/mis-tareas", verifyToken, verifyRole("cliente"), misTareas);
router.get("/disponibles", verifyToken, verifyRole("trabajador"), tareasDisponibles);
router.patch("/:id/completar", verifyToken, verifyRole("cliente"),
  param("id").isInt({ min: 1 }), validate, completarTarea);
router.get("/:id", verifyToken,
  param("id").isInt({ min: 1 }), validate, getTareaById);

module.exports = router;
