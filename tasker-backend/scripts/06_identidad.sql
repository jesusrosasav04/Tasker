-- 06 · Identidad: CURP única por especialista, teléfono único por cuenta
-- y registro del consentimiento del aviso de privacidad.
-- (La primera sentencia falla con 1060 si ya se aplicó: el script la salta)

ALTER TABLE usuarios
  ADD COLUMN privacidad_aceptada_at DATETIME NULL AFTER perfil_completo;

ALTER TABLE trabajador
  ADD COLUMN curp VARCHAR(18) NULL,
  ADD UNIQUE KEY uq_trabajador_curp (curp);

-- Teléfonos existentes a 10 dígitos (quita espacios, guiones y +52)
UPDATE usuarios
   SET telefono = RIGHT(REGEXP_REPLACE(telefono, '[^0-9]', ''), 10)
 WHERE telefono IS NOT NULL;
UPDATE usuarios
   SET telefono = NULL
 WHERE telefono IS NOT NULL AND CHAR_LENGTH(telefono) <> 10;

-- Si dos cuentas ya compartían teléfono, lo conserva la más antigua
UPDATE usuarios u
  JOIN (SELECT telefono, MIN(id) AS conservar
          FROM usuarios
         WHERE telefono IS NOT NULL
         GROUP BY telefono
        HAVING COUNT(*) > 1) d
    ON u.telefono = d.telefono AND u.id <> d.conservar
   SET u.telefono = NULL;

ALTER TABLE usuarios
  ADD UNIQUE KEY uq_usuarios_telefono (telefono);
