const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { success, error } = require("../utils/response");

// GET /api/usuarios/perfil — Ver mi perfil
const getMiPerfil = async (req, res) => {
  const usuario_id = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT
        u.id, u.nombre, u.email, u.telefono,
        u.estado, u.created_at,
        r.nombre AS role,
        u.google_id IS NOT NULL AS usa_google
       FROM usuarios u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [usuario_id]
    );

    if (rows.length === 0)
      return error(res, "Usuario no encontrado", 404);

    return success(res, rows[0]);
  } catch (err) {
    console.error(err);
    return error(res, "Error al obtener perfil", 500);
  }
};

// PUT /api/usuarios/perfil — Actualizar nombre y teléfono
const actualizarPerfil = async (req, res) => {
  const usuario_id = req.user.id;
  const { nombre, telefono } = req.body;

  try {
    await db.query(
      `UPDATE usuarios SET
        nombre    = COALESCE(?, nombre),
        telefono  = COALESCE(?, telefono)
       WHERE id = ?`,
      [nombre?.trim() || null, telefono?.trim() || null, usuario_id]
    );

    const [actualizado] = await db.query(
      "SELECT id, nombre, email, telefono FROM usuarios WHERE id = ?",
      [usuario_id]
    );

    return success(res, actualizado[0], "Perfil actualizado correctamente");
  } catch (err) {
    console.error(err);
    return error(res, "Error al actualizar perfil", 500);
  }
};

// PATCH /api/usuarios/cambiar-password — Cambiar contraseña
const cambiarPassword = async (req, res) => {
  const usuario_id = req.user.id;
  const { password_actual, password_nueva } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT password, google_id FROM usuarios WHERE id = ?",
      [usuario_id]
    );

    if (rows.length === 0)
      return error(res, "Usuario no encontrado", 404);

    // No permitir cambio si usa Google OAuth y no tiene contraseña
    if (!rows[0].password)
      return error(res, "Tu cuenta usa Google para iniciar sesión. No puedes cambiar la contraseña.", 400);

    const valida = await bcrypt.compare(password_actual, rows[0].password);
    if (!valida)
      return error(res, "La contraseña actual es incorrecta", 400);

    const hash = await bcrypt.hash(password_nueva, 12);
    await db.query("UPDATE usuarios SET password = ? WHERE id = ?", [hash, usuario_id]);

    return success(res, null, "Contraseña actualizada correctamente");
  } catch (err) {
    console.error(err);
    return error(res, "Error al cambiar contraseña", 500);
  }
};

module.exports = { getMiPerfil, actualizarPerfil, cambiarPassword };
