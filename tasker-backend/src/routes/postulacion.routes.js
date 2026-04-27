const router = require("express").Router();
const {
  crearPostulacion,
  misPostulaciones,
  postulacionesPorTarea,
  aceptarPostulacion,
} = require("../controllers/postulacion.controller");
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { body, param } = require("express-validator");

const postulacionRules = [
  body("tarea_id").isInt({ min: 1 }).withMessage("ID de tarea inválido"),
  body("precio_propuesto")
    .optional()
    .isFloat({ min: 1, max: 999999 })
    .withMessage("Precio inválido"),
  body("mensaje")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("El mensaje no puede superar 1000 caracteres"),
];

const idParamRule = [param("id").isInt({ min: 1 }).withMessage("ID inválido")];

router.post(
  "/",
  verifyToken,
  verifyRole("trabajador"),
  postulacionRules,
  validate,
  crearPostulacion,
);

router.get(
  "/mis-postulaciones",
  verifyToken,
  verifyRole("trabajador"),
  misPostulaciones,
);

router.get(
  "/tarea/:id",
  verifyToken,
  verifyRole("cliente"),
  idParamRule,
  validate,
  postulacionesPorTarea,
);

router.patch(
  "/:id/aceptar",
  verifyToken,
  verifyRole("cliente"),
  idParamRule,
  validate,
  aceptarPostulacion,
);

module.exports = router;
