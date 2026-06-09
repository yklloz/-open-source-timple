$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$failures = New-Object System.Collections.Generic.List[string]

$repositories = @()
foreach ($candidate in @(
    $root,
    (Join-Path $root "yk_backend"),
    (Join-Path $root "yk_frontend")
)) {
    if (Test-Path (Join-Path $candidate ".git")) {
        $repositories += $candidate
    }
}

foreach ($repository in $repositories) {
    $tracked = git -C $repository ls-files
    foreach ($file in $tracked) {
        if ($file -match '(^|/)\.env($|\.)|\.pyc$|(^|/)(__pycache__|node_modules|\.venv|dist|\.expo)(/|$)|\.(db|sqlite|sqlite3|log)$') {
            $failures.Add("Blocked file is tracked in $repository`: $file")
        }
    }
}

$secretPattern = "(KAKAO_CLIENT_SECRET|KAKAO_REST_API_KEY|JWT_SECRET_KEY)="
$rg = Get-Command rg -ErrorAction SilentlyContinue

if ($rg) {
    $secretMatches = & $rg.Source --hidden `
        --glob "!**/.git/**" `
        --glob "!**/.env" `
        --glob "!**/.env.*" `
        --glob "!**/node_modules/**" `
        --glob "!**/.venv/**" `
        --glob "!**/dist/**" `
        $secretPattern `
        $root 2>$null
} else {
    $secretMatches = Get-ChildItem -Path $root -Recurse -Force -File -ErrorAction SilentlyContinue |
        Where-Object {
            $_.Name -notlike ".env*" -and
            $_.FullName -notmatch '[\\/](\.git|node_modules|\.venv|dist)[\\/]'
        } |
        Select-String -Pattern $secretPattern -ErrorAction SilentlyContinue
}

if ($secretMatches) {
    $realSecretMatches = $secretMatches | Where-Object {
        $_ -notmatch "YOUR_|GENERATE_|Paste_the_|example"
    }
    if ($realSecretMatches) {
        $failures.Add("Possible real secret found outside ignored .env files.")
    }
}

if ($failures.Count -gt 0) {
    Write-Host "Upload safety check failed:" -ForegroundColor Red
    $failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "Upload safety check passed." -ForegroundColor Green
