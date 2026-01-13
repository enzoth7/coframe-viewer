param(
    [string]$BackupPath = "..\coframe-viewer-backup-2025-02-13.zip",
    [string]$RestorePath = "..\coframe-viewer-restore",
    [switch]$Force
)

if (-not (Test-Path $BackupPath)) {
    throw "No se encontro el archivo de respaldo en $BackupPath"
}

if (Test-Path $RestorePath) {
    if (-not $Force) {
        throw "El directorio $RestorePath ya existe. Ejecuta con -Force para sobrescribirlo."
    }

    Remove-Item -Path $RestorePath -Recurse -Force
}

New-Item -ItemType Directory -Path $RestorePath | Out-Null
Expand-Archive -Path $BackupPath -DestinationPath $RestorePath -Force

Write-Host "Respaldo restaurado en $RestorePath."
Write-Host "Ingresa al directorio restaurado y ejecuta 'npm install' seguido de 'npm run dev' para validar la pagina."
