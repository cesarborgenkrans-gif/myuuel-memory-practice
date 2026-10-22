# Start Myuuel Memory Practice from this folder. Installs Electron on first launch,
# and makes a desktop-style shortcut with the Myuuel icon beside this script.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$npm = Get-Command 'npm.cmd' -ErrorAction SilentlyContinue
if (-not $npm) { throw 'npm.cmd was not found. Install Node.js, then run this launcher again.' }

$electronExe = Join-Path $root 'node_modules\electron\dist\electron.exe'
if (-not (Test-Path -LiteralPath $electronExe -PathType Leaf)) {
  Write-Host 'First launch: installing Electron (one time)...' -ForegroundColor Cyan
  Push-Location $root
  try {
    & $npm.Source install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE." }
  } finally { Pop-Location }
}

$shortcut = Join-Path $root 'Myuuel Memory Practice.lnk'
if (-not (Test-Path -LiteralPath $shortcut)) {
  try {
    $shell = New-Object -ComObject WScript.Shell
    $link = $shell.CreateShortcut($shortcut)
    $link.TargetPath = Join-Path $root 'Start-Myuuel-Memory-Practice.cmd'
    $link.WorkingDirectory = $root
    $link.IconLocation = (Join-Path $root 'assets\brand\icon.ico') + ',0'
    $link.WindowStyle = 7
    $link.Description = 'Myuuel Memory Practice'
    $link.Save()
  } catch { Write-Host 'Shortcut could not be created; the launcher still works.' -ForegroundColor Yellow }
}

Start-Process -FilePath $npm.Source -ArgumentList @('start') -WorkingDirectory $root -WindowStyle Hidden
Write-Host 'Myuuel Memory Practice is starting.' -ForegroundColor Green
