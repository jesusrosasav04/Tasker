const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { success, error } = require("../utils/response");

const generarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario.UsuarioID,
      email: usuario.email,
      role: usuario.role_nombre,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );
};

// ── POST /api/auth/register ─────────────────────────
const register = async (req, res) => {
  const { nombre, apellidoP, apellidoM, email, password, telefono, role } =
    req.body;

  if (!nombre || !email || !password || !role) {
    return error(res, "nombre, email, password y role son requeridos");
  }

  const rolesValidos = ["cliente", "trabajador"];
  if (!rolesValidos.includes(role)) {
    return error(res, "Role inválido. Usa: cliente o trabajador");
  }

  try {
    // Verificar si el email ya existe
    const [existe] = await db.query(
      "SELECT UsuarioID FROM usuarios WHERE email = ?",
      [email],
    );
    if (existe.length > 0) return error(res, "El email ya está registrado");

    // Obtener role_id
    const [roles] = await db.query("SELECT id FROM roles WHERE nombre = ?", [
      role,
    ]);
    if (roles.length === 0) return error(res, "Role no encontrado");

    // Hashear password
    const hash = await bcrypt.hash(password, 12);

    // Insertar usuario
    const [result] = await db.query(
      `INSERT INTO usuarios (nombre, apellidoP, apellidoM, email, password_hash, telefono, role_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        apellidoP || null,
        apellidoM || null,
        email,
        hash,
        telefono || null,
        roles[0].id,
      ],
    );

    const usuarioID = result.insertId;

    // Si es trabajador, crear registro en tabla trabajador
    if (role === "trabajador") {
      await db.query("INSERT INTO trabajador (UsuarioID) VALUES (?)", [
        usuarioID,
      ]);
    }

    // Obtener usuario completo para el token
    const [usuario] = await db.query(
      `SELECT u.UsuarioID, u.email, r.nombre AS role_nombre
       FROM usuarios u
       JOIN roles r ON u.role_id = r.id
       WHERE u.UsuarioID = ?`,
      [usuarioID],
    );

    const token = generarToken(usuario[0]);

    return success(
      res,
      {
        mensaje: "Usuario registrado exitosamente",
        token,
        usuario: {
          id: usuarioID,
          nombre,
          email,
          role,
        },
      },
      201,
    );
  } catch (err) {
    console.error("Error en register:", err);
    return error(res, "Error interno del servidor", 500);
  }
};

// ── POST /api/auth/login ────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return error(res, "Email y password son requeridos");
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

    const passwordValido = await bcrypt.compare(
      password,
      usuario.password_hash,
    );
    if (!passwordValido) return error(res, "Credenciales incorrectas", 401);

    const token = generarToken(usuario);

    return success(res, {
      token,
      usuario: {
        id: usuario.UsuarioID,
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role_nombre,
        FotoPerfilURL: usuario.FotoPerfilURL,
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    return error(res, "Error interno del servidor", 500);
  }
};

// ── GET /api/auth/me ────────────────────────────────
const me = async (req, res) => {
  try {
    const [usuarios] = await db.query(
      `SELECT u.UsuarioID, u.nombre, u.apellidoP, u.apellidoM,
              u.email, u.telefono, u.FotoPerfilURL, u.FechaRegistro,
              r.nombre AS role
       FROM usuarios u
       JOIN roles r ON u.role_id = r.id
       WHERE u.UsuarioID = ? AND u.estado = 1`,
      [req.user.id],
    );

    if (usuarios.length === 0) return error(res, "Usuario no encontrado", 404);

    return success(res, usuarios[0]);
  } catch (err) {
    console.error("Error en me:", err);
    return error(res, "Error interno del servidor", 500);
  }
};

module.exports = { register, login, me };
