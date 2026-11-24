const router = require("express").Router();
const { getEstado, comprar, confirmar } = require("../controllers/credito.controller");
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { body, query } = require("express-validator");
const { PAQUETES } = require("../config/creditos");

router.get("/", verifyToken, verifyRole("trabajador"), getEstado);

router.post(
  "/comprar",
  verifyToken,
  verifyRole("trabajador"),
  [body("paquete_id").isIn(PAQUETES.map((p) => p.id)).withMessage("Paquete inválido")],
  validate,
  comprar,
);

router.get(
  "/confirmar",
  verifyToken,
  verifyRole("trabajador"),
  [query("session_id").isString().trim().notEmpty().withMessage("Falta session_id")],
  validate,
  confirmar,
);

module.exports = router;
