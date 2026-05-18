const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // ← debe estar ARRIBA
const db = require("../config/db");
const { success, error } = require("../utils/response");

// ── Helper: cookie segura con JWT ────────────────────
const JWT_COOKIE = "jwt_token";
const COOKIE_OPTIONS = {
  httpOnly: true,                                          // No accesible por JS
  secure: process.env.NODE_ENV === "production",          // Solo HTTPS en prod
  sameSite: "Strict",                                     // Previene CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000,                       // 7 días
  path: "/",
};

const setJwtCookie = (res, token) => {
  res.cookie(JWT_COOKIE, token, COOKIE_OPTIONS);
};

const clearJwtCookie = (res) => {
  res.clearCookie(JWT_COOKIE, { path: "/", sameSite: "Strict", secure: process.env.NODE_ENV === "production" });
};

const {
  privateKey,
  JWT_ALGORITHM,
  JWT_EXPIRES_IN,
} = require("../config/jwt-keys");

// ─── Helper ────────────────────────────────────────────────
const generarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      role: usuario.role_nombre, // ← siempre el nombre: "cliente", "trabajador", "admin"
    },
    privateKey,
    { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRES_IN },
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  const { nombre, email, password, telefono, role } = req.body;

  const rolesValidos = ["cliente", "trabajador"];
  if (!rolesValidos.includes(role)) {
    return error(res, "Role inválido. Usa: cliente o trabajador", 400);
  }

  try {
    const [existe] = await db.query("SELECT id FROM usuarios WHERE email = ?", [
      email,
    ]);
    if (existe.length > 0)
      return error(res, "El email ya está registrado", 409);

    const [roles] = await db.query("SELECT id FROM roles WHERE nombre = ?", [
      role,
    ]);
    if (roles.length === 0) return error(res, "Role no encontrado", 400);

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO usuarios (nombre, email, password, telefono, role_id)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, email, hash, telefono || null, roles[0].id],
    );

    const usuarioID = result.insertId;

    if (role === "trabajador") {
      const [trab] = await db.query("INSERT INTO trabajador (usuario_id) VALUES (?)", [usuarioID]);
      const trabajador_id = trab.insertId;

      // Guardar categorías seleccionadas
      if (Array.isArray(req.body.categorias) && req.body.categorias.length > 0) {
        const values = req.body.categorias.map((cat_id) => [trabajador_id, cat_id]);
        await db.query("INSERT IGNORE INTO trabajador_categorias (trabajador_id, categoria_id) VALUES ?", [values]);
      }
    }

    const [usuario] = await db.query(
      `SELECT u.id, u.email, r.nombre AS role_nombre
       FROM usuarios u JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [usuarioID],
    );

    const token = generarToken(usuario[0]);
    setJwtCookie(res, token); // Cookie HttpOnly segura

    return success(
      res,
      { token, usuario: { id: usuarioID, nombre, email, role } },
      "Usuario registrado exitosamente",
      201,
    );
  } catch (err) {
    console.error("Error en register:", err);
    return error(res, "Error interno del servidor", 500);
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [usuarios] = await db.query(
      `SELECT u.*, r.nombre AS role_nombre
       FROM usuarios u JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? AND u.estado = 1`,
      [email],
    );

    if (usuarios.length === 0)
      return error(res, "Credenciales incorrectas", 401);

    const usuario = usuarios[0];
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) return error(res, "Credenciales incorrectas", 401);

    const token = generarToken(usuario);
    setJwtCookie(res, token); // Cookie HttpOnly segura

    return success(res, {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role_nombre,
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    return error(res, "Error interno del servidor", 500);
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  try {
    const [usuarios] = await db.query(
      `SELECT u.id, u.nombre, u.email, u.telefono, u.created_at, r.nombre AS role
       FROM usuarios u JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.estado = 1`,
      [req.user.id],
    );

    if (usuarios.length === 0) return error(res, "Usuario no encontrado", 404);
    return success(res, usuarios[0]);
  } catch (err) {
    console.error("Error en me:", err);
    return error(res, "Error interno del servidor", 500);
  }
};

// GET /api/auth/google/callback
const googleCallback = (req, res) => {
  const user = req.user;

  // Genera token consistente con login normal (RS256, llave privada)
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role_nombre || "cliente" },
    privateKey,
    { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRES_IN },
  );

  res.redirect(
    `${process.env.FRONTEND_URL}/auth/google/success?token=${token}`,
  );
};


// POST /api/auth/logout
const logout = (req, res) => {
  clearJwtCookie(res);
  return success(res, null, "Sesión cerrada correctamente");
};

module.exports = {
  logout, register, login, me, googleCallback };
