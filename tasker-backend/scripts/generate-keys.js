/**
 * Genera un par de llaves RSA de 2048 bits para firmar JWT con RS256.
 * Ejecutar con: npm run keys:generate
 *
 * IMPORTANTE: La llave privada (private.pem) NUNCA debe subirse al repo.
 * Está incluida en .gitignore.
 */
const { generateKeyPairSync } = require("crypto");
const fs = require("fs");
const path = require("path");

const keysDir = path.join(__dirname, "..", "keys");

if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

const privatePath = path.join(keysDir, "private.pem");
const publicPath = path.join(keysDir, "public.pem");

if (fs.existsSync(privatePath) || fs.existsSync(publicPath)) {
  console.error(
    "❌  Ya existen llaves en", keysDir,
    "\n   Bórralas manualmente si quieres regenerarlas (esto invalidará todos los JWT actuales)."
  );
  process.exit(1);
}

console.log("🔑  Generando par de llaves RSA 2048...");

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

fs.writeFileSync(privatePath, privateKey, { mode: 0o600 });
fs.writeFileSync(publicPath, publicKey, { mode: 0o644 });

console.log("✅  Llaves generadas:");
console.log("   ", privatePath, " (privada — NO compartir)");
console.log("   ", publicPath, "  (pública — puede compartirse)");
console.log("\nAsegúrate de tener en tu .env:");
console.log("   JWT_PRIVATE_KEY_PATH=./keys/private.pem");
console.log("   JWT_PUBLIC_KEY_PATH=./keys/public.pem");
console.log("   JWT_EXPIRES_IN=2h");
