# Migraciones de la base de datos

Cuando jales cambios de `develop` que traigan archivos nuevos en
`tasker-backend/scripts/` con nombre `NN_*.sql` (por ejemplo
`01_password_resets.sql`, `02_reportes_soporte.sql`), tienes que aplicarlos a tu
base de datos. Docker **solo** ejecuta el SQL cuando crea la base por primera vez,
no sobre una base que ya existe.

## Opción A — Aplicarlas sin perder tus datos (recomendado)

Con el contenedor corriendo (`docker compose up -d`), desde `tasker-backend`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\aplicar-migraciones.ps1
```

El script aplica en orden todas las migraciones `NN_*.sql`. Es seguro correrlo
varias veces: las que ya estaban aplicadas las marca como "ya estaba aplicada" y sigue.

Si prefieres aplicarlas una por una a mano:

```powershell
Get-Content scripts\01_password_resets.sql | docker exec -i tasker-mysql mysql -uroot -ptasker123 tasker
Get-Content scripts\02_reportes_soporte.sql | docker exec -i tasker-mysql mysql -uroot -ptasker123 tasker
Get-Content scripts\03_onboarding_google.sql | docker exec -i tasker-mysql mysql -uroot -ptasker123 tasker
Get-Content scripts\04_creditos.sql | docker exec -i tasker-mysql mysql -uroot -ptasker123 tasker
Get-Content scripts\05_evidencias.sql | docker exec -i tasker-mysql mysql -uroot -ptasker123 tasker
Get-Content scripts\06_identidad.sql | docker exec -i tasker-mysql mysql -uroot -ptasker123 tasker
```

## Opción B — Empezar de cero (borra todos los datos)

Solo si no te importa perder lo que tengas en la base:

```powershell
docker compose down -v
docker compose up -d
```

Al recrearse, Docker ejecuta `schema.sql` y las migraciones listadas en
`docker-compose.yml` automáticamente. Si agregas una migración nueva, súmala ahí.

## Nota

Cada quien debe tener su propio archivo `.env` en `tasker-backend/` (no se sube al
repo). Copia `.env.example` y llénalo con los datos de Docker:
`DB_HOST=localhost`, `DB_USER=root`, `DB_PASSWORD=tasker123`, `DB_NAME=tasker`.
