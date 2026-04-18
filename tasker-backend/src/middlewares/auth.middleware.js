const jwt = require("jsonwebtoken");
const { error } = require("../utils/response");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) return error(res, "Token requerido", 401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
