const router = require("express").Router();
const { getMensajes, enviarMensaje, noLeidos } = require("../controllers/mensaje.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

const enviarRules = [
  body("tarea_id").isInt({ min: 1 }).withMessage("tarea_id inválido"),
  body("mensaje").trim().notEmpty().withMessage("El mensaje no puede estar vacío")
    .isLength({ max: 1000 }).withMessage("El mensaje no puede superar 1000 caracteres"),
];

router.get("/no-leidos", verifyToken, noLeidos);
router.get("/:tarea_id", verifyToken, param("tarea_id").isInt({ min: 1 }), validate, getMensajes);
router.post("/", verifyToken, enviarRules, validate, enviarMensaje);

module.exports = router;
