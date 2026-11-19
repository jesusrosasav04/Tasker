# Aplica todas las migraciones (scripts/NN_*.sql) a la base en Docker, en orden.
# Uso, desde la carpeta tasker-backend:
#   powershell -ExecutionPolicy Bypass -File scripts\aplicar-migraciones.ps1
#
# Requiere el contenedor "tasker-mysql" corriendo (docker compose up -d).

$ErrorActionPreference = "Stop"
$contenedor = "tasker-mysql"
$usuario    = "root"
$password   = "tasker123"
$basedatos  = "tasker"

$scripts = Get-ChildItem -Path $PSScriptRoot -Filter "*.sql" |
  Where-Object { $_.Name -match "^\d{2}_" } |
  Sort-Object Name

if (-not $scripts) {
  Write-Host "No hay migraciones (archivos NN_*.sql) en scripts\." -ForegroundColor Yellow
  exit 0
}

foreach ($s in $scripts) {
  Write-Host "→ Aplicando $($s.Name) ..." -ForegroundColor Cyan
  Get-Content $s.FullName -Raw | docker exec -i $contenedor mysql -u$usuario -p$password $basedatos
  if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Falló $($s.Name). Revisa el error de arriba." -ForegroundColor Red
    exit 1
  }
  Write-Host "✓ $($s.Name) aplicada." -ForegroundColor Green
}

Write-Host "`nListo. Todas las migraciones se aplicaron." -ForegroundColor Green
