const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// ── Seguridad ──────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: "Demasiadas solicitudes, intenta más tarde." },
});
app.use(limiter);

// ── Body Parser ────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Conexión DB ────────────────────────────────────
require("./config/db");

// ── Rutas ──────────────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/usuarios", require("./routes/usuario.routes"));
app.use("/api/tareas", require("./routes/tarea.routes"));
app.use("/api/categorias", require("./routes/categoria.routes"));
app.use("/api/pagos", require("./routes/pago.routes"));
app.use("/api/mensajes", require("./routes/mensaje.routes"));
app.use("/api/calificaciones", require("./routes/calificacion.routes"));
app.use("/api/documentos", require("./routes/documento.routes"));
app.use("/api/notificaciones", require("./routes/notificacion.routes"));
app.use("/api/trabajadores", require("./routes/trabajador.routes"));

// ── Health check ───────────────────────────────────
app.get("/", (req, res) => {
  res.json({ mensaje: "🚀 Tasker API funcionando", version: "1.0.0" });
});

// ── Manejo de rutas no encontradas ─────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ── Manejo global de errores ───────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

// ── Servidor ───────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
