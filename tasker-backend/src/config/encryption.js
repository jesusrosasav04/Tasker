const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH  = 12; // 96 bits — recomendado para GCM
const TAG_LENGTH = 16; // 128 bits — tamaño estándar del auth tag

/**
 * Obtiene la clave de 32 bytes desde la variable de entorno.
 * Si no existe lanza un error en el arranque (fail-fast).
 */
const getKey = () => {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY no definida en .env");

  // Acepta hex de 64 chars (32 bytes) o cualquier string que se hashea a 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  // Si no es hex de 64 chars, derivar 32 bytes con SHA-256
  return crypto.createHash("sha256").update(raw).digest();
};

/**
 * Cifra un texto plano con AES-256-GCM.
 * Formato de salida: "<iv_hex>:<tag_hex>:<ciphertext_hex>"
 */
const encrypt = (plaintext) => {
  if (!plaintext) return plaintext; // null/undefined pasan sin cambio

  const key = getKey();
  const iv  = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Formato: iv:tag:datos — todo en hex
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
};

/**
 * Descifra un texto previamente cifrado con encrypt().
 * Si el formato no coincide (datos legacy sin cifrar) los devuelve tal cual.
 */
const decrypt = (ciphertext) => {
  if (!ciphertext) return ciphertext;

  const parts = String(ciphertext).split(":");
  if (parts.length !== 3) return ciphertext; // dato legacy — devolver sin cambio

  const [ivHex, tagHex, dataHex] = parts;

  try {
    const key  = getKey();
    const iv   = Buffer.from(ivHex,  "hex");
    const tag  = Buffer.from(tagHex, "hex");
    const data = Buffer.from(dataHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_LENGTH,
    });
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    // Si falla la verificación del auth tag → dato corrupto o sin cifrar
    return ciphertext;
  }
};

module.exports = { encrypt, decrypt };
