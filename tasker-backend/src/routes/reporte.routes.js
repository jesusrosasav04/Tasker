const router = require("express").Router();
const { crearReporte, misReportes, getReporte, getImagen, enviarMensaje } = require("../controllers/reporte.controller");
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { subirArchivo } = require("../middlewares/upload.middleware");
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

const idRule = param("id").isInt({ min: 1 }).withMessage("ID inválido");
const crearRules = [
  body("tipo").isIn(["bug", "pago", "usuario", "servicio", "otro"]).withMessage("Tipo de reporte inválido"),
  body("motivo").trim().isLength({ min: 10, max: 2000 }).withMessage("Describe el problema (10 a 2000 caracteres)"),
  body("tarea_id").optional({ values: "falsy" }).isInt({ min: 1 }).withMessage("Tarea inválida"),
  body("disputa").optional().isIn(["true", "false", "1", "0"]),
];
const mensajeRules = [
  body("mensaje").trim().notEmpty().withMessage("El mensaje no puede estar vacío")
    .isLength({ max: 1000 }).withMessage("El mensaje no puede superar 1000 caracteres"),
];

router.use(verifyToken);

// multer va antes de la validación: es quien llena req.body en multipart
router.post("/", verifyRole("cliente", "trabajador"),
  subirArchivo("reportes", "imagen", ["image/jpeg", "image/png", "image/webp"]), crearRules, validate, crearReporte);
router.get("/mis-reportes", verifyRole("cliente", "trabajador"), misReportes);
router.get("/:id", idRule, validate, getReporte);
router.get("/:id/imagen", idRule, validate, getImagen);
router.post("/:id/mensajes", idRule, mensajeRules, validate, enviarMensaje);

module.exports = router;
