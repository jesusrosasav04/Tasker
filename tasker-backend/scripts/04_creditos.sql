-- Migración 04: modelo de créditos (freemium) — aditiva
-- Aplicar (PowerShell):
--   Get-Content scripts\04_creditos.sql | docker exec -i tasker-mysql mysql -uroot -ptasker123 tasker
--
-- Modelo: cada trabajador tiene 3 postulaciones gratis. Después, cada
-- postulación consume 1 crédito. Los créditos se compran en paquetes (Stripe).

ALTER TABLE `trabajador`
  ADD COLUMN `plan` ENUM('freemium','premium') NOT NULL DEFAULT 'freemium',
  ADD COLUMN `creditos` INT NOT NULL DEFAULT 0;

-- Historial de créditos: compras (+), consumos (-) y bonos (+).
-- trabajador_id → trabajador.id (perfil), NO usuarios.id
CREATE TABLE IF NOT EXISTS `movimientos_credito` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `trabajador_id` INT NOT NULL,
  `tipo` ENUM('compra','consumo','bono') NOT NULL,
  `cantidad` INT NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  `referencia_pago` VARCHAR(255) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Evita acreditar dos veces el mismo pago de Stripe
  UNIQUE KEY `uq_referencia_pago` (`referencia_pago`),
  KEY `idx_mov_trabajador` (`trabajador_id`),
  CONSTRAINT `movimientos_credito_ibfk_1`
    FOREIGN KEY (`trabajador_id`) REFERENCES `trabajador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
