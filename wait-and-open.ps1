Write-Host "Waiting for frontend at http://localhost:3000..." -ForegroundColor Yellow

$ready = $false
while (-not $ready) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        $ready = $true
    } catch {
        $ready = $false
    }
}

Write-Host "Frontend is ready! Opening Chrome..." -ForegroundColor Green
Start-Process "chrome" "http://localhost:3000"
