const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // ← debe estar ARRIBA
const db = require("../config/db");
const { success, error } = require("../utils/response");
const { normalizarTelefono, telefonoEnUso, mensajeDuplicado } = require("../utils/identidad");

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
      perfil_completo: usuario.perfil_completo ?? 1, // 0 = aún no elige rol (Google)
    },
    privateKey,
    { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRES_IN },
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  const { nombre, email, password, telefono } = req.body;

  try {
    const [existe] = await db.query("SELECT id FROM usuarios WHERE email = ?", [
      email,
    ]);
    if (existe.length > 0)
      return error(res, "El email ya está registrado", 409);

    // Un teléfono = una cuenta
    const tel = telefono ? normalizarTelefono(telefono) : null;
    if (tel && (await telefonoEnUso(db, tel)))
      return error(res, "Este teléfono ya está registrado en otra cuenta", 409);

    // Igual que Google: nace como cliente provisional con perfil_completo = 0
    // y elige su rol real en /bienvenida (POST /auth/completar-perfil)
    const [roles] = await db.query("SELECT id FROM roles WHERE nombre = 'cliente'");
    if (roles.length === 0) return error(res, "Role no encontrado", 400);

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO usuarios (nombre, email, password, telefono, role_id, perfil_completo, privacidad_aceptada_at)
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [nombre, email, hash, tel, roles[0].id],
    );

    const usuarioID = result.insertId;

    const [usuario] = await db.query(
      `SELECT u.id, u.email, u.perfil_completo, r.nombre AS role_nombre
       FROM usuarios u JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [usuarioID],
    );

    const token = generarToken(usuario[0]);
    setJwtCookie(res, token); // Cookie HttpOnly segura

    return success(
      res,
      { token, usuario: { id: usuarioID, nombre, email, role: "cliente", perfil_completo: 0, privacidad_aceptada: 1 } },
      "Usuario registrado exitosamente",
      201,
    );
  } catch (err) {
    const dup = mensajeDuplicado(err);
    if (dup) return error(res, dup, 409);
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
        perfil_completo: usuario.perfil_completo,
        privacidad_aceptada: usuario.privacidad_aceptada_at ? 1 : 0,
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
      `SELECT u.id, u.nombre, u.email, u.telefono, u.created_at, u.perfil_completo,
              (u.privacidad_aceptada_at IS NOT NULL) AS privacidad_aceptada, r.nombre AS role
       FROM usuarios u JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.estado = 1`,
      [req.user.id],
    );

    if (usuarios.length === 0) return error(res, "Usuario no encontrado", 404);

    // El formulario "Mi perfil" precarga estos datos; sin ellos, guardar borraba descripción y categorías
    if (usuarios[0].role === "trabajador") {
      const [[perfil]] = await db.query("SELECT id, descripcion, curp, verificado FROM trabajador WHERE usuario_id = ?", [req.user.id]);
      if (perfil) {
        const [cats] = await db.query("SELECT categoria_id FROM trabajador_categorias WHERE trabajador_id = ?", [perfil.id]);
        // Estado de la identificación oficial (documentos.trabajador_id = usuarios.id)
        const [[ine]] = await db.query(
          `SELECT COUNT(*) AS subidas, COALESCE(SUM(verificado = 1), 0) AS verificadas
           FROM documentos WHERE trabajador_id = ? AND tipo = 'identificacion'`,
          [req.user.id],
        );
        usuarios[0].descripcion = perfil.descripcion;
        usuarios[0].categorias_ids = cats.map((c) => c.categoria_id);
        usuarios[0].curp = perfil.curp;
        usuarios[0].verificado = perfil.verificado;
        usuarios[0].identificacion =
          Number(ine.verificadas) > 0 ? "verificada" : Number(ine.subidas) > 0 ? "en_revision" : "ninguna";
      }
    }

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
    {
      id: user.id,
      email: user.email,
      role: user.role_nombre || "cliente",
      perfil_completo: user.perfil_completo ?? 1,
    },
    privateKey,
    { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRES_IN },
  );

  res.redirect(
    `${process.env.FRONTEND_URL}/auth/google/success?token=${token}`,
  );
};

// POST /api/auth/completar-perfil  (onboarding de usuarios de Google)
// El usuario ya está autenticado (token); aquí define si es cliente o
// trabajador y, si es trabajador, sus categorías. Deja perfil_completo = 1.
const completarPerfil = async (req, res) => {
  const { role } = req.body;
  // Sin duplicados: trabajador_categorias tiene llave única (trabajador_id, categoria_id)
  const categorias = [...new Set(Array.isArray(req.body.categorias) ? req.body.categorias : [])];

  if (!["cliente", "trabajador"].includes(role))
    return error(res, "Rol inválido. Usa: cliente o trabajador", 400);
  if (role === "trabajador" && categorias.length === 0)
    return error(res, "Elige al menos una categoría", 400);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // FOR UPDATE: dos envíos simultáneos no crean dos perfiles de trabajador
    const [[usuario]] = await conn.query(
      "SELECT id, email, perfil_completo, privacidad_aceptada_at FROM usuarios WHERE id = ? AND estado = 1 FOR UPDATE",
      [req.user.id],
    );
    if (!usuario) {
      await conn.rollback();
      return error(res, "Usuario no encontrado", 404);
    }

    // Si ya completó su perfil, no permitir re-elegir rol por esta vía
    if (usuario.perfil_completo === 1) {
      await conn.rollback();
      return error(res, "El perfil ya fue configurado", 409);
    }

    // Quien entró con Google aún no ha aceptado el aviso de privacidad
    if (!usuario.privacidad_aceptada_at && req.body.acepta_privacidad !== true) {
      await conn.rollback();
      return error(res, "Debes aceptar el aviso de privacidad para continuar", 400);
    }

    const [[rol]] = await conn.query("SELECT id FROM roles WHERE nombre = ?", [role]);
    if (!rol) {
      await conn.rollback();
      return error(res, "Rol no encontrado", 400);
    }

    if (role === "trabajador") {
      const [[perfil]] = await conn.query(
        "SELECT id FROM trabajador WHERE usuario_id = ?",
        [req.user.id],
      );
      let trabajador_id = perfil?.id;
      if (!trabajador_id) {
        const [t] = await conn.query(
          "INSERT INTO trabajador (usuario_id, verificado) VALUES (?, 0)",
          [req.user.id],
        );
        trabajador_id = t.insertId;
      }
      // trabajador_categorias usa trabajador.id (no usuarios.id)
      const values = categorias.map((cat_id) => [trabajador_id, cat_id]);
      await conn.query(
        // Sin IGNORE: una categoría inexistente debe fallar (1452), no descartarse
        `INSERT INTO trabajador_categorias (trabajador_id, categoria_id) VALUES ?
         ON DUPLICATE KEY UPDATE trabajador_id = trabajador_id`,
        [values],
      );
    }

    await conn.query(
      `UPDATE usuarios SET role_id = ?, perfil_completo = 1,
         privacidad_aceptada_at = COALESCE(privacidad_aceptada_at, NOW())
       WHERE id = ?`,
      [rol.id, req.user.id],
    );
    await conn.commit();

    const token = generarToken({
      id: usuario.id,
      email: usuario.email,
      role_nombre: role,
      perfil_completo: 1,
    });
    setJwtCookie(res, token);

    return success(res, {
      token,
      usuario: { id: usuario.id, email: usuario.email, role, perfil_completo: 1 },
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    // Categoría que no existe (llave foránea)
    if (err.errno === 1452) return error(res, "Categoría inválida", 400);
    console.error("Error en completarPerfil:", err);
    return error(res, "Error interno del servidor", 500);
  } finally {
    conn.release();
  }
};


// POST /api/auth/logout
const logout = (req, res) => {
  clearJwtCookie(res);
  return success(res, null, "Sesión cerrada correctamente");
};

// ── Recuperar contraseña ─────────────────────────────
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const MENSAJE_OLVIDE = "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.";

// POST /api/auth/forgot-password — genera token de un solo uso (30 min)
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [usuarios] = await db.query(
      "SELECT id FROM usuarios WHERE email = ? AND estado = 1",
      [email],
    );

    // Misma respuesta exista o no el correo: no revela qué cuentas existen
    if (usuarios.length === 0) return success(res, null, MENSAJE_OLVIDE);

    const token = crypto.randomBytes(32).toString("hex");
    // Invalida enlaces anteriores del mismo usuario
    await db.query("UPDATE password_resets SET usado = 1 WHERE usuario_id = ? AND usado = 0", [usuarios[0].id]);
    await db.query(
      `INSERT INTO password_resets (usuario_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))`,
      [usuarios[0].id, hashToken(token)],
    );

    const enlace = `${process.env.FRONTEND_URL || "http://localhost:5173"}/restablecer?token=${token}`;
    // shortcut: no hay servicio de correo; el enlace se imprime en consola. Para producción, enviar `enlace` por email (ver README)
    console.log(`[recuperar contraseña] ${email} → ${enlace}`);

    return success(
      res,
      process.env.NODE_ENV === "development" ? { dev_enlace: enlace } : null,
      MENSAJE_OLVIDE,
    );
  } catch (err) {
    console.error("Error en forgotPassword:", err);
    return error(res, "Error interno del servidor", 500);
  }
};

// POST /api/auth/reset-password — cambia la contraseña con un token válido
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const [resets] = await db.query(
      `SELECT id, usuario_id FROM password_resets
       WHERE token_hash = ? AND usado = 0 AND expires_at > NOW()`,
      [hashToken(token)],
    );

    if (resets.length === 0)
      return error(res, "El enlace no es válido o ya expiró. Solicita uno nuevo.", 400);

    // Marcar como usado primero: si llegan dos peticiones a la vez, solo una gana
    const [upd] = await db.query("UPDATE password_resets SET usado = 1 WHERE id = ? AND usado = 0", [resets[0].id]);
    if (upd.affectedRows === 0)
      return error(res, "El enlace no es válido o ya expiró. Solicita uno nuevo.", 400);

    const hash = await bcrypt.hash(password, 10);
    await db.query("UPDATE usuarios SET password = ? WHERE id = ?", [hash, resets[0].usuario_id]);

    return success(res, null, "Contraseña actualizada. Ya puedes iniciar sesión.");
  } catch (err) {
    console.error("Error en resetPassword:", err);
    return error(res, "Error interno del servidor", 500);
  }
};

module.exports = {
  logout, register, login, me, googleCallback, completarPerfil, forgotPassword, resetPassword };
