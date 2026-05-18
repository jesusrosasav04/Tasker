const crypto = require("crypto");

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

// Genera y envía un nuevo token CSRF como cookie
const generarCsrfToken = (req, res) => {
  const token = crypto.randomBytes(32).toString("hex");

  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,    // Debe ser legible por JS para enviarlo como header
    sameSite: "Strict", // Previene envío en requests cross-site
    secure: process.env.NODE_ENV === "production", // Solo HTTPS en prod
    maxAge: 60 * 60 * 1000, // 1 hora
  });

  return res.json({ ok: true, data: { csrf_token: token } });
};

// Middleware: valida token CSRF en métodos no seguros
const verifyCsrf = (req, res, next) => {
  // Los métodos seguros no necesitan CSRF
  if (SAFE_METHODS.includes(req.method)) return next();

  const tokenCookie  = req.cookies?.[CSRF_COOKIE];
  const tokenHeader  = req.headers?.[CSRF_HEADER];

  if (!tokenCookie || !tokenHeader) {
    return res.status(403).json({
      ok: false,
      error: "Token CSRF faltante. Refresca la página e intenta de nuevo.",
    });
  }

  // Comparación de tiempo constante para prevenir timing attacks
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

  next();
};

module.exports = { generarCsrfToken, verifyCsrf };
