const router = require("express").Router();
const { getMisDocumentos, subirDocumento, eliminarDocumento, verificarDocumento } = require("../controllers/documento.controller");
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

const subirRules = [
  body("tipo").trim().notEmpty().withMessage("El tipo es obligatorio"),
  body("url").trim().isURL().withMessage("La URL del documento no es válida"),
];

router.get("/mis-documentos", verifyToken, verifyRole("trabajador"), getMisDocumentos);
router.post("/", verifyToken, verifyRole("trabajador"), subirRules, validate, subirDocumento);
router.delete("/:id", verifyToken, verifyRole("trabajador"), param("id").isInt({ min: 1 }), validate, eliminarDocumento);
router.patch("/:id/verificar", verifyToken, verifyRole("admin"), param("id").isInt({ min: 1 }), validate, verificarDocumento);

module.exports = router;
