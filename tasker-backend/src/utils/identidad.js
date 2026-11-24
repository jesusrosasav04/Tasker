// Validaciones de identidad (México): CURP y teléfono.

// Formato oficial de RENAPO: 4 letras, fecha AAMMDD, sexo, entidad, 3 consonantes,
// diferenciador de siglo y dígito verificador
const CURP_REGEX =
  /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HMX](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/;
const DICCIONARIO = "0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

const normalizarCurp = (v) => String(v || "").trim().toUpperCase();

// Formato + dígito verificador (posición 18): detecta CURPs inventadas o mal capturadas
const curpValida = (curp) => {
  if (!CURP_REGEX.test(curp)) return false;
  let suma = 0;
  for (let i = 0; i < 17; i++) suma += DICCIONARIO.indexOf(curp[i]) * (18 - i);
  return (10 - (suma % 10)) % 10 === Number(curp[17]);
};

// Deja solo dígitos y acepta +52 al inicio. Devuelve 10 dígitos o null si no es válido.
const normalizarTelefono = (v) => {
  let d = String(v || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("52")) d = d.slice(2);
  return /^\d{10}$/.test(d) ? d : null;
};

// ¿Otra cuenta ya usa este teléfono?
const telefonoEnUso = async (db, telefono, excluirUsuarioId = 0) => {
  const [r] = await db.query("SELECT id FROM usuarios WHERE telefono = ? AND id <> ?", [telefono, excluirUsuarioId]);
  return r.length > 0;
};

// Mensaje para un choque de llave única (carrera entre dos registros simultáneos)
const mensajeDuplicado = (err) => {
  if (err?.code !== "ER_DUP_ENTRY") return null;
  if (err.message.includes("uq_usuarios_telefono")) return "Este teléfono ya está registrado en otra cuenta";
  if (err.message.includes("uq_trabajador_curp")) return "Esta CURP ya está registrada en otra cuenta";
  return "El email ya está registrado";
};

const MSG_TELEFONO = "Teléfono inválido: escribe 10 dígitos";
const MSG_CURP = "CURP inválida: revisa que tenga 18 caracteres y esté bien escrita";

module.exports = {
  normalizarCurp, curpValida, normalizarTelefono, telefonoEnUso, mensajeDuplicado,
  MSG_TELEFONO, MSG_CURP,
};
