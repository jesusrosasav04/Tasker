-- Migración 05: entrega con evidencia + doble aprobación (aditiva)
-- Aplicar (PowerShell):
--   Get-Content scripts\05_evidencias.sql | docker exec -i tasker-mysql mysql -uroot -ptasker123 tasker
--
-- Nuevo ciclo: en_progreso → entregado (trabajador sube foto) → completada (cliente aprueba).
-- tareas.estado es VARCHAR, así que 'entregado' no requiere cambiar el tipo.

ALTER TABLE `tareas`
  ADD COLUMN `entregado_at` DATETIME NULL,
  ADD COLUMN `aprobado_at` DATETIME NULL;

CREATE TABLE IF NOT EXISTS `evidencias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tarea_id` INT NOT NULL,
  `url` VARCHAR(255) NOT NULL,          -- ruta relativa dentro de uploads/ (evidencias/<archivo>)
  `nota` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_evidencias_tarea` (`tarea_id`),
  CONSTRAINT `evidencias_ibfk_1`
    FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
