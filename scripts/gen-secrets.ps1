<#
Generate two secure secrets (SESSION_SECRET and JWT_SECRET) and update the local .env file.

Usage:
  Open PowerShell in the project root and run:
    .\scripts\gen-secrets.ps1

The script prints the generated secrets and updates the `.env` file in-place.
It will not commit anything to git. Make sure `.env` is in `.gitignore` (it is by default).
#>

Write-Host "Generating SESSION_SECRET and JWT_SECRET..."

$session = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
$jwt = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')

Write-Host "SESSION_SECRET=$session"
Write-Host "JWT_SECRET=$jwt"

$envPath = Join-Path -Path (Get-Location) -ChildPath '.env'
if (Test-Path $envPath) {
    $content = Get-Content $envPath -Raw
    $content = $content -replace 'SESSION_SECRET=.*', "SESSION_SECRET=$session"
    $content = $content -replace 'JWT_SECRET=.*', "JWT_SECRET=$jwt"
    Set-Content -Path $envPath -Value $content -NoNewline
    Write-Host "Updated $envPath with new secrets (local only)."
} else {
    Write-Host "No .env file found at $envPath. Creating one with the secrets."
    @"
SESSION_SECRET=$session
JWT_SECRET=$jwt
"@ | Set-Content -Path $envPath
    Write-Host "Created $envPath (local only)."
}

Write-Host "Done. Do NOT commit the .env file to git."
