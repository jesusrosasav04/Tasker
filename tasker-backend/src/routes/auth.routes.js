const router = require("express").Router();
const passport = require("passport");
const {
  register,
  login,
  me,
  googleCallback,
} = require("../controllers/auth.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { authLimiter } = require("../middlewares/rateLimiter.middleware");
const validate = require("../middlewares/validate.middleware");
const { body } = require("express-validator");

const registerRules = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ max: 100 })
    .withMessage("Nombre demasiado largo"),
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres")
    .isLength({ max: 72 })
    .withMessage("Contraseña demasiado larga"),
  body("role_id").isInt({ min: 1, max: 3 }).withMessage("Rol inválido"),
  body("telefono")
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage("Teléfono inválido"),
];

const loginRules = [
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  body("password").notEmpty().withMessage("La contraseña es obligatoria"),
];

// Rutas normales
router.post("/register", authLimiter, registerRules, validate, register);
router.post("/login", authLimiter, loginRules, validate, login);
router.get("/me", verifyToken, me);

// Rutas Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login-failed",
  }),
  googleCallback,
);

router.get("/login-failed", (req, res) => {
  res
    .status(401)
    .json({ ok: false, error: "Autenticación con Google fallida" });
});

module.exports = router;
