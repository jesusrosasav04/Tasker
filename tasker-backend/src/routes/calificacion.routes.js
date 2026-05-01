const router = require("express").Router();
const { crearCalificacion, getCalificacionTarea } = require("../controllers/calificacion.controller");
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

const crearRules = [
  body("tarea_id").isInt({ min: 1 }).withMessage("tarea_id inválido"),
  body("puntuacion")
    .isInt({ min: 1, max: 5 })
    .withMessage("La puntuación debe ser un número entre 1 y 5"),
  body("comentario")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("El comentario no puede superar 500 caracteres"),
];

// Solo clientes pueden calificar
router.post("/", verifyToken, verifyRole("cliente"), crearRules, validate, crearCalificacion);
router.get("/tarea/:tarea_id", verifyToken, verifyRole("cliente"),
  param("tarea_id").isInt({ min: 1 }), validate, getCalificacionTarea
);

module.exports = router;
