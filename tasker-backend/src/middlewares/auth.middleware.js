const { publicKey } = require("../config/jwt-keys");
const jwt = require("jsonwebtoken");
const { error } = require("../utils/response");

const JWT_COOKIE = "jwt_token";

const verifyToken = (req, res, next) => {
  // 1. Intentar desde header Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];

  // 2. Si no hay header, intentar desde cookie HttpOnly
  if (!token && req.cookies?.[JWT_COOKIE]) {
    token = req.cookies[JWT_COOKIE];
  }

  if (!token) return error(res, "Token requerido", 401);

  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ["RS256"], // Whitelist explícita — previene alg:none y confusion attacks
    });
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, "Token inválido o expirado", 401);
  }
};

const verifyRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return error(res, "No tienes permisos para esta acción", 403);
    }
    next();
  };
};

module.exports = { verifyToken, verifyRole };
