const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { success, error } = require("../utils/response");

const generarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      role: usuario.role_nombre,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  const { nombre, email, password, telefono, role } = req.body;

  if (!nombre || !email || !password || !role) {
    return error(res, "nombre, email, password y role son requeridos", 400);
  }

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
      await db.query("INSERT INTO trabajador (usuario_id) VALUES (?)", [
        usuarioID,
      ]);
    }

    const [usuario] = await db.query(
      `SELECT u.id, u.email, r.nombre AS role_nombre
       FROM usuarios u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [usuarioID],
    );

    const token = generarToken(usuario[0]);

    return success(
      res,
      {
        token,
        usuario: { id: usuarioID, nombre, email, role },
      },
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

  if (!email || !password) {
    return error(res, "Email y password son requeridos", 400);
  }

  try {
    const [usuarios] = await db.query(
      `SELECT u.*, r.nombre AS role_nombre
       FROM usuarios u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? AND u.estado = 1`,
      [email],
    );

    if (usuarios.length === 0) {
      return error(res, "Credenciales incorrectas", 401);
    }

    const usuario = usuarios[0];

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) return error(res, "Credenciales incorrectas", 401);

    const token = generarToken(usuario);

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
      `SELECT u.id, u.nombre, u.email, u.telefono, u.created_at,
              r.nombre AS role
       FROM usuarios u
       JOIN roles r ON u.role_id = r.id
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
const jwt = require("jsonwebtoken");

const googleCallback = (req, res) => {
  // req.user viene de passport después de autenticarse
  const user = req.user;

  const token = jwt.sign(
    { id: user.id, role_id: user.role_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  // Redirige al frontend con el token en la URL
  // El frontend lo captura y lo guarda en localStorage
  res.redirect(
    `${process.env.FRONTEND_URL}/auth/google/success?token=${token}`,
  );
};
module.exports = { register, login, me, googleCallback };
