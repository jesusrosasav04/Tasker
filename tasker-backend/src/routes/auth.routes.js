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
const { publicKey, JWT_ALGORITHM } = require("../config/jwt-keys");

const registerRules = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ max: 100 })
    .withMessage("Nombre demasiado largo"),
  body("email").isEmail().withMessage("Email inválido"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres")
    .isLength({ max: 72 })
    .withMessage("Contraseña demasiado larga"),
  body("role")
    .isIn(["cliente", "trabajador"])
    .withMessage("Rol inválido. Usa: cliente o trabajador"),
  body("telefono")
    .optional()
    .trim()
    .isLength({ max: 20 })
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

// Llave pública para verificar JWT (firma digital asimétrica RS256).
// Cualquier cliente puede verificar tokens emitidos por el servidor con esta llave,
// pero solo el servidor (que tiene la llave privada) puede emitirlos.
router.get("/public-key", (req, res) => {
  res.json({
    ok: true,
    data: {
      algorithm: JWT_ALGORITHM,
      key_type: "RSA",
      format: "PEM (SPKI)",
      public_key: publicKey,
    },
  });
});

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

router.post("/logout", logout);

module.exports = router;
