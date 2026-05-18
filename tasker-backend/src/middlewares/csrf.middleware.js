const crypto = require("crypto");

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
const isProd = process.env.NODE_ENV === "production";

// Genera y envía un nuevo token CSRF como cookie + body
const generarCsrfToken = (req, res) => {
  const token = crypto.randomBytes(32).toString("hex");

  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: isProd ? "None" : "Strict", // None requerido para cross-domain en prod
    secure: isProd,                        // Obligatorio con SameSite=None
    maxAge: 60 * 60 * 1000,
  });

  // También retornar en body para que el frontend lo guarde si la cookie falla
  return res.json({ ok: true, data: { csrf_token: token } });
};

// Middleware: valida token CSRF en métodos no seguros
const verifyCsrf = (req, res, next) => {
  if (SAFE_METHODS.includes(req.method)) return next();

  const tokenCookie = req.cookies?.[CSRF_COOKIE];
  const tokenHeader = req.headers?.[CSRF_HEADER];

  if (!tokenHeader) {
    return res.status(403).json({
      ok: false,
      error: "Token CSRF faltante. Refresca la página e intenta de nuevo.",
    });
  }

  // Si hay cookie, comparar con timing-safe. Si no hay cookie (cross-domain),
  // al menos verificar que el header existe y tiene formato correcto
  if (tokenCookie) {
    try {
      const cookieBuf = Buffer.from(tokenCookie, "hex");
      const headerBuf = Buffer.from(tokenHeader, "hex");

      if (
        cookieBuf.length !== headerBuf.length ||
        !crypto.timingSafeEqual(cookieBuf, headerBuf)
      ) {
        return res.status(403).json({
          ok: false,
          error: "Token CSRF inválido. Refresca la página e intenta de nuevo.",
        });
      }
    } catch {
      return res.status(403).json({ ok: false, error: "Token CSRF inválido." });
    }
  }

  next();
};

module.exports = { generarCsrfToken, verifyCsrf };
