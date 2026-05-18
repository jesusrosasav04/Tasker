const jwt = require("jsonwebtoken");
const { error } = require("../utils/response");
const { publicKey, JWT_ALGORITHM } = require("../config/jwt-keys");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) return error(res, "Token requerido", 401);

  try {
    // Verificación asimétrica: usamos la llave PÚBLICA, no la privada.
    // El algorithms whitelist previene ataques de algorithm confusion (alg: none, HS256, etc.)
    const decoded = jwt.verify(token, publicKey, {
      algorithms: [JWT_ALGORITHM],
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
