-- Migración 02: reportes generales, disputas e hilo de soporte (aditiva, conserva datos)
-- Aplicar: docker exec -i tasker-mysql mysql -uroot -ptasker123 tasker < scripts/02_reportes_soporte.sql
-- Requiere 01_password_resets.sql? No. Requiere scripts/migration_reportes.sql (tabla reportes).

-- ── reportes ─────────────────────────────────────────
-- tarea_id pasa a opcional (reportes de bugs, pagos, etc. sin tarea)
ALTER TABLE `reportes` MODIFY `tarea_id` int NULL;

ALTER TABLE `reportes`
  ADD COLUMN `tipo` enum('bug','pago','usuario','servicio','otro') NOT NULL DEFAULT 'otro' AFTER `tarea_id`,
  ADD COLUMN `creado_por` int NULL AFTER `tipo`,
  ADD COLUMN `imagen` varchar(255) NULL AFTER `motivo`,
  ADD COLUMN `disputa` tinyint(1) NOT NULL DEFAULT 0 AFTER `imagen`,
  ADD COLUMN `updated_at` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;

-- Reportes viejos: quien reportaba siempre era el cliente
UPDATE `reportes` SET `creado_por` = `cliente_id`, `tipo` = 'servicio' WHERE `creado_por` IS NULL;

ALTER TABLE `reportes`
  MODIFY `creado_por` int NOT NULL,
  MODIFY `cliente_id` int NULL,  -- columna heredada; los reportes nuevos usan creado_por
  ADD KEY `creado_por` (`creado_por`),
  ADD KEY `estado_tipo` (`estado`, `tipo`),
  ADD CONSTRAINT `reportes_ibfk_3` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`);

-- ── mensajes: hilo de soporte reutiliza la tabla del chat ──
-- Un mensaje pertenece a una tarea (chat cliente↔trabajador) o a un reporte (usuario↔soporte)
ALTER TABLE `mensajes`
  MODIFY `tarea_id` int NULL,
  MODIFY `receptor_id` int NULL,  -- NULL = mensaje para "soporte" (lo ve cualquier admin)
  ADD COLUMN `reporte_id` int NULL AFTER `tarea_id`,
  ADD KEY `reporte_id` (`reporte_id`),
  ADD CONSTRAINT `mensajes_ibfk_4` FOREIGN KEY (`reporte_id`) REFERENCES `reportes` (`id`) ON DELETE CASCADE;

-- tareas.estado es varchar(20): el nuevo estado 'disputa' no requiere cambio de esquema
