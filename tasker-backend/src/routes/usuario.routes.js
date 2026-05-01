const router = require("express").Router();
const { getMiPerfil, actualizarPerfil, cambiarPassword } = require("../controllers/usuario.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { body } = require("express-validator");
const validate = require("../middlewares/validate.middleware");

const perfilRules = [
  body("nombre").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Nombre entre 2 y 100 caracteres"),
  body("telefono").optional().trim().isLength({ max: 20 }),
];

const passwordRules = [
  body("password_actual").notEmpty().withMessage("La contraseña actual es obligatoria"),
  body("password_nueva").isLength({ min: 6 }).withMessage("La nueva contraseña debe tener al menos 6 caracteres"),
];

router.get("/perfil", verifyToken, getMiPerfil);
router.put("/perfil", verifyToken, perfilRules, validate, actualizarPerfil);
router.patch("/cambiar-password", verifyToken, passwordRules, validate, cambiarPassword);

module.exports = router;
