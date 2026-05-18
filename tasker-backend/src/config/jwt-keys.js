/**
 * Carga las llaves RSA para firmar/verificar JWT con RS256.
 * Soporta dos modos:
 *   1. Variables de entorno (producción en Railway):
 *      JWT_PRIVATE_KEY y JWT_PUBLIC_KEY con el contenido PEM directamente
 *   2. Archivos .pem (desarrollo local):
 *      JWT_PRIVATE_KEY_PATH y JWT_PUBLIC_KEY_PATH con rutas a los archivos
 */
const fs   = require("fs");
const path = require("path");

let privateKey, publicKey;

// Modo 1: claves directamente en variables de entorno (Railway / producción)
if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
  // Railway escapa los saltos de línea, hay que restaurarlos
  privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, "\n");
  publicKey  = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");

// Modo 2: archivos .pem (desarrollo local)
} else {
  const PROJECT_ROOT = path.join(__dirname, "..", "..");
  const privatePath  = path.resolve(
    PROJECT_ROOT,
    process.env.JWT_PRIVATE_KEY_PATH || "./keys/private.pem"
  );
  const publicPath = path.resolve(
    PROJECT_ROOT,
    process.env.JWT_PUBLIC_KEY_PATH || "./keys/public.pem"
  );

  if (!fs.existsSync(privatePath) || !fs.existsSync(publicPath)) {
    console.error(
      "\n❌  No se encontraron las llaves RSA para firmar JWT.\n" +
        `   Esperadas en:\n     ${privatePath}\n     ${publicPath}\n\n` +
        "   Ejecuta:  npm run keys:generate\n"
    );
    process.exit(1);
  }

  privateKey = fs.readFileSync(privatePath, "utf8");
  publicKey  = fs.readFileSync(publicPath,  "utf8");
}

const JWT_ALGORITHM = "RS256";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

module.exports = { privateKey, publicKey, JWT_ALGORITHM, JWT_EXPIRES_IN };
