/**
 * Carga las llaves RSA para firmar/verificar JWT con RS256.
 *
 * - La llave privada SOLO se usa para firmar (auth.controller.js)
 * - La llave pública se usa para verificar (auth.middleware.js)
 *   y se expone públicamente en GET /api/auth/public-key
 *
 * Si las llaves no existen, ejecuta: npm run keys:generate
 */
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.join(__dirname, "..", "..");

const privatePath = path.resolve(
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

const privateKey = fs.readFileSync(privatePath, "utf8");
const publicKey = fs.readFileSync(publicPath, "utf8");

const JWT_ALGORITHM = "RS256";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";

module.exports = {
  privateKey,
  publicKey,
  JWT_ALGORITHM,
  JWT_EXPIRES_IN,
};
