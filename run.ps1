$ErrorActionPreference = "Stop"

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $name"
  }
}

Require-Command docker

Write-Host "Starting database..."
docker compose up -d db | Out-Host

Write-Host "Starting backend (runs prisma db push + seed on boot)..."
docker compose up -d --build backend | Out-Host

Write-Host ""
Write-Host "Backend: http://localhost:3000"
Write-Host ""
Write-Host "Admin provisioning:"
Write-Host "- Set ADMIN_EMAIL and ADMIN_PASSWORD in .env (root) or shell env"
Write-Host "- Then re-run: docker compose up -d --build backend"

