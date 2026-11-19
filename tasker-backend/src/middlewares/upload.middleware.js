const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { error } = require("../utils/response");

// Fuera de cualquier carpeta pública: los archivos solo se sirven por endpoints con control de acceso
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

const EXTENSIONES = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "application/pdf": ".pdf" };

// Crea un middleware que acepta un solo archivo opcional (`campo`) y lo guarda en uploads/<carpeta>
const subirArchivo = (carpeta, campo = "archivo", tipos = Object.keys(EXTENSIONES)) => {
  const destino = path.join(UPLOADS_DIR, carpeta);
  fs.mkdirSync(destino, { recursive: true });

  const upload = multer({
    storage: multer.diskStorage({
      destination: destino,
      // Nombre aleatorio: nunca se usa el nombre que manda el usuario
      filename: (req, file, cb) => cb(null, crypto.randomUUID() + EXTENSIONES[file.mimetype]),
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) =>
      tipos.includes(file.mimetype) ? cb(null, true) : cb(new Error("TIPO_NO_PERMITIDO")),
  }).single(campo);

  const permitidos = tipos.map((t) => EXTENSIONES[t].slice(1).toUpperCase()).join(", ");

  return (req, res, next) =>
    upload(req, res, (err) => {
      if (!err) {
        // Si la petición termina en error (validación, permisos, BD), no dejar el archivo huérfano
        if (req.file) res.on("finish", () => { if (res.statusCode >= 400) fs.unlink(req.file.path, () => {}); });
        return next();
      }
      if (err.code === "LIMIT_FILE_SIZE") return error(res, "El archivo no debe pasar de 5 MB", 400);
      if (err.message === "TIPO_NO_PERMITIDO") return error(res, `Solo se permiten archivos ${permitidos}`, 400);
      return error(res, "No se pudo subir el archivo", 400);
    });
};

// Ruta absoluta de un archivo guardado como "carpeta/nombre", o null si intenta salirse de uploads/
const rutaArchivo = (relativa) => {
  const abs = path.resolve(UPLOADS_DIR, relativa);
  return abs.startsWith(UPLOADS_DIR + path.sep) ? abs : null;
};

module.exports = { subirArchivo, rutaArchivo };
