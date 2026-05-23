-- Migración: crear tabla reportes
CREATE TABLE IF NOT EXISTS `reportes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tarea_id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `motivo` text NOT NULL,
  `estado` enum('pendiente','revisado','resuelto') DEFAULT 'pendiente',
  `resolucion` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `tarea_id` (`tarea_id`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`tarea_id`) REFERENCES `tareas` (`id`),
  CONSTRAINT `reportes_ibfk_2` FOREIGN KEY (`cliente_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
