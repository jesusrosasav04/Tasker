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
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const nombre = profile.displayName;
          const google_id = profile.id;

          const [existing] = await pool.query(
            "SELECT * FROM usuarios WHERE google_id = ?",
            [google_id]
          );

          if (existing.length > 0) {
            return done(null, existing[0]);
          }

          const [byEmail] = await pool.query(
            "SELECT * FROM usuarios WHERE email = ?",
            [email]
          );

          if (byEmail.length > 0) {
            await pool.query("UPDATE usuarios SET google_id = ? WHERE id = ?", [
              google_id,
              byEmail[0].id,
            ]);
            return done(null, byEmail[0]);
          }

          const [result] = await pool.query(
            `INSERT INTO usuarios (role_id, nombre, email, google_id, estado)
             VALUES (2, ?, ?, ?, 1)`,
            [nombre, email, google_id]
          );

          const [newUser] = await pool.query(
            "SELECT * FROM usuarios WHERE id = ?",
            [result.insertId]
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
