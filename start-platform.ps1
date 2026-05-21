# start-platform.ps1 - Start backend (Go) and frontend (Next.js) for SecureCoder Platform
# Run from: securecoder-platform directory
# Pure PowerShell - no WSL, no Docker required

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pgBin = "C:\tools\pgsql\pgsql\bin"

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     SecureCoder CTF Platform Launcher    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# --- Ensure PostgreSQL is running ---
Write-Host "==> Checking PostgreSQL..." -ForegroundColor Yellow
$pgRunning = & "$pgBin\pg_ctl.exe" status -D "C:\tools\pgsql\data" 2>&1
if ($pgRunning -notlike "*server is running*") {
    Write-Host "    Starting PostgreSQL..." -ForegroundColor Cyan
    & "$pgBin\pg_ctl.exe" start -D "C:\tools\pgsql\data" -l "C:\tools\pgsql\pg.log" -o "-p 5432"
    Start-Sleep -Seconds 3
}
Write-Host "    PostgreSQL: RUNNING on :5432" -ForegroundColor Green

# --- Start Backend ---
Write-Host ""
Write-Host "==> Starting Backend (Go) on :8080..." -ForegroundColor Yellow
$backendDir = Join-Path $root "backend"
$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    $env:PATH = "C:\tools\pgsql\pgsql\bin;$env:PATH"
    go run cmd/api/main.go 2>&1
} -ArgumentList $backendDir

Write-Host "    Backend: STARTING (Job ID: $($backendJob.Id))" -ForegroundColor Green
Start-Sleep -Seconds 5

# --- Start Frontend ---
Write-Host ""
Write-Host "==> Starting Frontend (Next.js) on :3000..." -ForegroundColor Yellow
$frontendDir = Join-Path $root "frontend"
$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev 2>&1
} -ArgumentList $frontendDir

Write-Host "    Frontend: STARTING (Job ID: $($frontendJob.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  Platform Starting Up!                   ║" -ForegroundColor Green
Write-Host "║                                          ║" -ForegroundColor Green
Write-Host "║  Frontend:  http://localhost:3000        ║" -ForegroundColor Green
Write-Host "║  Backend:   http://localhost:8080        ║" -ForegroundColor Green
Write-Host "║  Leaderboard: /leaderboard              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop monitoring. Jobs continue in background." -ForegroundColor Gray
Write-Host "To stop all: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Gray
Write-Host ""

# Monitor output for 30 seconds
$deadline = (Get-Date).AddSeconds(30)
while ((Get-Date) -lt $deadline) {
    $backendOut = Receive-Job $backendJob
    $frontendOut = Receive-Job $frontendJob
    if ($backendOut)  { $backendOut  | ForEach-Object { Write-Host "[backend]  $_" -ForegroundColor DarkCyan } }
    if ($frontendOut) { $frontendOut | ForEach-Object { Write-Host "[frontend] $_" -ForegroundColor DarkMagenta } }
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Both services are running. Visit http://localhost:3000" -ForegroundColor Cyan
