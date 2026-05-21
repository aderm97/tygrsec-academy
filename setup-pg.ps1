# setup-pg.ps1 - Extract, init, and start PostgreSQL portable on Windows (PowerShell only)

$zipPath = "C:\tools\pgsql\pgsql.zip"
$extractTo = "C:\tools\pgsql"
$pgBin = "C:\tools\pgsql\pgsql\bin"
$pgData = "C:\tools\pgsql\data"
$pgLog = "C:\tools\pgsql\pg.log"
$pgPass = "securecoder_password"

Write-Host "==> Extracting PostgreSQL..." -ForegroundColor Cyan
Expand-Archive -Path $zipPath -DestinationPath $extractTo -Force
Write-Host "==> Extracted to $extractTo" -ForegroundColor Green

# Add to PATH for this session
$env:PATH = "$pgBin;$env:PATH"

# Init DB cluster
if (-not (test-path "$pgData\PG_VERSION")) {
    Write-Host "==> Initializing database cluster at $pgData ..." -ForegroundColor Cyan
    & "$pgBin\initdb.exe" -D $pgData -U postgres --encoding=UTF8 --auth=trust
    Write-Host "==> Cluster initialized." -ForegroundColor Green
} else {
    Write-Host "==> Cluster already initialized at $pgData." -ForegroundColor Yellow
}

# Start PostgreSQL
Write-Host "==> Starting PostgreSQL..." -ForegroundColor Cyan
& "$pgBin\pg_ctl.exe" start -D $pgData -l $pgLog -o "-p 5432"
Start-Sleep -Seconds 3

# Create securecoder user and DB
Write-Host "==> Creating securecoder user and database..." -ForegroundColor Cyan
& "$pgBin\psql.exe" -U postgres -p 5432 -c "CREATE USER securecoder WITH PASSWORD '$pgPass';" 2>$null
& "$pgBin\psql.exe" -U postgres -p 5432 -c "CREATE DATABASE securecoder OWNER securecoder;" 2>$null
& "$pgBin\psql.exe" -U postgres -p 5432 -c "GRANT ALL PRIVILEGES ON DATABASE securecoder TO securecoder;" 2>$null

Write-Host "==> PostgreSQL ready on port 5432!" -ForegroundColor Green
Write-Host "    User: securecoder | DB: securecoder | Pass: securecoder_password" -ForegroundColor White
