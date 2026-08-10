# Set console encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path "$scriptPath\flashbook-client"

Write-Host "Starting Vite frontend..." -ForegroundColor Green
npm run dev
