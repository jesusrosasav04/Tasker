# Aplica todas las migraciones (scripts/NN_*.sql) a la base en Docker, en orden.
# Uso, desde la carpeta tasker-backend:
#   powershell -ExecutionPolicy Bypass -File scripts\aplicar-migraciones.ps1
#
# Requiere el contenedor "tasker-mysql" corriendo (docker compose up -d).
# Se puede correr las veces que quieras: lo que ya estaba aplicado se salta.

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
  # Con "Stop", el stderr de mysql haría tronar el script antes de poder revisarlo
  $ErrorActionPreference = "Continue"
  $salida = Get-Content $s.FullName -Raw |
    docker exec -i $contenedor mysql "-u$usuario" "-p$password" $basedatos 2>&1 |
    ForEach-Object { "$_" } | Where-Object { $_ -notmatch "Using a password" } | Out-String
  $codigo = $LASTEXITCODE
  $ErrorActionPreference = "Stop"

  if ($codigo -eq 0) {
    Write-Host "✓ $($s.Name) aplicada." -ForegroundColor Green
  } elseif ($salida -match "ERROR (1050|1060|1061|1826)") {
    # 1050 tabla / 1060 columna / 1061 índice / 1826 llave foránea: ya existe.
    # shortcut: asume que si el primer cambio ya existe, todo el archivo ya estaba
    # aplicado; si algún día una migración queda a medias, hay que llevar registro
    # en una tabla de migraciones.
    Write-Host "• $($s.Name) ya estaba aplicada." -ForegroundColor DarkGray
  } else {
    Write-Host $salida
    Write-Host "✗ Falló $($s.Name). Revisa el error de arriba." -ForegroundColor Red
    exit 1
  }
}

Write-Host "`nListo. Todas las migraciones se aplicaron." -ForegroundColor Green
