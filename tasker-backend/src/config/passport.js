const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("./db");

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true, // necesario para leer req.query.state
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email     = profile.emails[0].value;
          const nombre    = profile.displayName;
          const google_id = profile.id;

          // Rol enviado en el state (solo aplica para usuarios NUEVOS)
          const roleSolicitado = req.query.state || "cliente";
          const roleNombre     = ["cliente", "trabajador"].includes(roleSolicitado)
            ? roleSolicitado
            : "cliente";

          // Usuario ya existe por google_id
          const [existing] = await pool.query(
            `SELECT u.*, r.nombre AS role_nombre
             FROM usuarios u JOIN roles r ON u.role_id = r.id
             WHERE u.google_id = ?`,
            [google_id]
          );
          if (existing.length > 0) return done(null, existing[0]);

          // Usuario ya existe por email — vincular google_id
          const [byEmail] = await pool.query(
            `SELECT u.*, r.nombre AS role_nombre
             FROM usuarios u JOIN roles r ON u.role_id = r.id
             WHERE u.email = ?`,
            [email]
          );
          if (byEmail.length > 0) {
            await pool.query("UPDATE usuarios SET google_id = ? WHERE id = ?", [
              google_id, byEmail[0].id,
            ]);
            return done(null, byEmail[0]);
          }

          // Usuario nuevo — obtener role_id
          const [roles] = await pool.query(
            "SELECT id FROM roles WHERE nombre = ?", [roleNombre]
          );
          const role_id = roles[0]?.id || 2; // fallback: cliente

          const [result] = await pool.query(
            `INSERT INTO usuarios (role_id, nombre, email, google_id, estado)
             VALUES (?, ?, ?, ?, 1)`,
            [role_id, nombre, email, google_id]
          );

          const newUserId = result.insertId;

          // Si es trabajador, crear perfil en tabla trabajador
          if (roleNombre === "trabajador") {
            await pool.query(
              "INSERT INTO trabajador (usuario_id, verificado) VALUES (?, 0)",
              [newUserId]
            );
          }

          const [newUser] = await pool.query(
            `SELECT u.*, r.nombre AS role_nombre
             FROM usuarios u JOIN roles r ON u.role_id = r.id
             WHERE u.id = ?`,
            [newUserId]
          );

          return done(null, newUser[0]);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn("⚠️  Google OAuth no configurado — GOOGLE_CLIENT_ID no definido");
}

module.exports = passport;
