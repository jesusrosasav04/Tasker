const router = require("express").Router();
const { getMisDocumentos, subirDocumento, getArchivo, eliminarDocumento, verificarDocumento } = require("../controllers/documento.controller");
const { verifyToken, verifyRole } = require("../middlewares/auth.middleware");
const { subirArchivo } = require("../middlewares/upload.middleware");
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

const subirRules = [
  body("tipo").trim().isIn(["identificacion", "certificado", "titulo", "otro"]).withMessage("Tipo de documento inválido"),
];
const idRule = param("id").isInt({ min: 1 });

router.get("/mis-documentos", verifyToken, verifyRole("trabajador"), getMisDocumentos);
// multer va antes de la validación: es quien llena req.body en multipart
router.post("/", verifyToken, verifyRole("trabajador"), subirArchivo("documentos"), subirRules, validate, subirDocumento);
router.get("/:id/archivo", verifyToken, verifyRole("trabajador", "admin"), idRule, validate, getArchivo);
router.delete("/:id", verifyToken, verifyRole("trabajador"), idRule, validate, eliminarDocumento);
router.patch("/:id/verificar", verifyToken, verifyRole("admin"), idRule, validate, verificarDocumento);

module.exports = router;
