param(
    [string]$Destination = (Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) "yk_hanium_share")
)

$ErrorActionPreference = "Stop"
$source = Split-Path -Parent $PSScriptRoot
$sourcePath = [System.IO.Path]::GetFullPath($source).TrimEnd("\")
$destinationPath = [System.IO.Path]::GetFullPath($Destination)

if (Test-Path $destinationPath) {
    throw "Destination already exists: $destinationPath"
}

if ($destinationPath.StartsWith("$sourcePath\", [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Destination must be outside the source project: $destinationPath"
}

New-Item -ItemType Directory -Path $destinationPath | Out-Null

$excludedDirectories = @(
    ".git",
    ".venv",
    "venv",
    "node_modules",
    ".expo",
    "dist",
    "web-build",
    "__pycache__"
)

$excludedFiles = @(
    ".env",
    "*.pyc",
    "*.db",
    "*.sqlite",
    "*.sqlite3",
    "*.log"
)

$arguments = @(
    $source,
    $destinationPath,
    "/E",
    "/XD"
) + $excludedDirectories + @(
    "/XF"
) + $excludedFiles + @(
    "/R:1",
    "/W:1",
    "/NFL",
    "/NDL",
    "/NJH",
    "/NJS",
    "/NP"
)

& robocopy @arguments | Out-Null
if ($LASTEXITCODE -ge 8) {
    throw "robocopy failed with exit code $LASTEXITCODE"
}

$environmentFiles = Get-ChildItem -Path $destinationPath -Recurse -Force -File -Filter ".env*" |
    Where-Object { $_.Name -ne ".env.example" }

foreach ($environmentFile in $environmentFiles) {
    $resolvedFile = [System.IO.Path]::GetFullPath($environmentFile.FullName)
    if (-not $resolvedFile.StartsWith("$destinationPath\", [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove a file outside the clean copy: $resolvedFile"
    }
    Remove-Item -LiteralPath $resolvedFile -Force
}

git -C $destinationPath init
Write-Host "Clean share repository created at: $destinationPath" -ForegroundColor Green
Write-Host "Review it, run scripts/check-upload-safety.ps1, then add your GitHub remote." -ForegroundColor Cyan
