# Set console encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path "$scriptPath\server"

Write-Host "Loading environment variables from .env..." -ForegroundColor Green
Get-Content .env | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
    $name, $val = $_ -split '=', 2
    Set-Item -Path "env:\$($name.Trim())" -Value ($val.Trim())
}

Write-Host "Starting Spring Boot backend..." -ForegroundColor Green
if (Test-Path "mvnw.cmd") {
    & .\mvnw.cmd spring-boot:run
} elseif (Get-Command "mvn" -ErrorAction SilentlyContinue) {
    mvn spring-boot:run
} else {
    Write-Error "Maven is not installed or not on the system PATH, and no Maven Wrapper (mvnw.cmd) was found in the server directory. Please install Maven or run this command in an environment with Maven."
    exit 1
}
