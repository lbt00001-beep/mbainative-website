$ErrorActionPreference = "Stop"

$required = @(
  "frontend/package.json",
  "frontend/index.html",
  "frontend/src/main.js",
  "frontend/src/style.css",
  "backend/package.json",
  "backend/server.js"
)

$missing = @()
foreach ($file in $required) {
  if (-not (Test-Path $file)) {
    $missing += $file
  }
}

if ($missing.Count -gt 0) {
  Write-Host "Missing files:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "Verify OK: required files exist." -ForegroundColor Green
