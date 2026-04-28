require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const hpp = require("hpp");
const passport = require("passport");
require("./config/passport");
const { apiLimiter } = require("./middlewares/rateLimiter.middleware");

const app = express();

app.use(helmet());
app.use(hpp());
app.use(passport.initialize());

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin && process.env.NODE_ENV !== "production")
        return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("CORS: origen no permitido"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use("/api", apiLimiter);

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/categorias", require("./routes/categoria.routes"));
app.use("/api/trabajadores", require("./routes/trabajador.routes"));
app.use("/api/tareas", require("./routes/tarea.routes"));
app.use("/api/postulaciones", require("./routes/postulacion.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

app.use((err, req, res, next) => {
  if (err.message?.includes("CORS")) {
    return res.status(403).json({ ok: false, error: "Origen no permitido" });
  }
  if (err.type === "entity.too.large") {
    return res
      .status(413)
      .json({ ok: false, error: "Payload demasiado grande" });
  }
  console.error(err);
  res.status(500).json({ ok: false, error: "Error interno del servidor" });
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Ruta no encontrada" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
