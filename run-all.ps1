# Set console encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "Launching backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-File", "$scriptPath\run-backend.ps1"

Write-Host "Launching frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-File", "$scriptPath\run-frontend.ps1"

Write-Host "Services launched successfully in separate terminal windows." -ForegroundColor Green
