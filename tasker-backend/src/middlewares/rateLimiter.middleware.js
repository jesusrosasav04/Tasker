const rateLimit = require("express-rate-limit");

// Para login/register — más restrictivo
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Demasiados intentos. Intenta de nuevo en 15 minutos.",
  },
});

// Para el resto de la API — general
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Demasiadas solicitudes. Intenta de nuevo en un momento.",
  },
});

module.exports = { authLimiter, apiLimiter };
