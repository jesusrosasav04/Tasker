-- Migración 03: onboarding de rol para usuarios que entran con Google (aditiva)
-- Aplicar: Get-Content scripts\03_onboarding_google.sql | docker exec -i tasker-mysql mysql -uroot -ptasker123 tasker
--
-- Al entrar con Google por primera vez, el usuario todavía no eligió si es
-- cliente o especialista. Nace con perfil_completo = 0 y el frontend lo manda
-- a /bienvenida. Al elegir su rol, pasa a 1 y ya no vuelve a esa pantalla.
-- Los usuarios que ya existen tienen rol definido, así que el default 1 aplica.

ALTER TABLE `usuarios`
  ADD COLUMN `perfil_completo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `estado`;
