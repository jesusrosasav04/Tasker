const router = require("express").Router();
const { getMetodos, registrarPago, getPagoTarea, getMisPagos } = require("../controllers/pago.controller");
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

const registrarRules = [
  body("tarea_id").isInt({ min: 1 }).withMessage("tarea_id inválido"),
  body("metodo_pago_id").isInt({ min: 1 }).withMessage("Método de pago inválido"),
  body("monto").isFloat({ min: 0.01 }).withMessage("El monto debe ser mayor a 0"),
  body("referencia").optional().trim().isLength({ max: 255 }),
];

router.get("/metodos", verifyToken, getMetodos);
router.get("/mis-pagos", verifyToken, verifyRole("cliente"), getMisPagos);
router.get("/tarea/:tarea_id", verifyToken, param("tarea_id").isInt({ min: 1 }), validate, getPagoTarea);
router.post("/", verifyToken, verifyRole("cliente"), registrarRules, validate, registrarPago);

module.exports = router;
