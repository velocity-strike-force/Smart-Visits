param(
    [string]$Stage = "dev",
    [switch]$Clean
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$serverPath = Join-Path $repoRoot "server"
$buildPath = Join-Path $serverPath ".aws-sam\build"
$zipPath = Join-Path $serverPath ".aws-sam\zips"

if ($Clean -and (Test-Path (Join-Path $serverPath ".aws-sam"))) {
    Remove-Item (Join-Path $serverPath ".aws-sam") -Recurse -Force
}

Push-Location $serverPath
try {
    Write-Host "Building Lambda artifacts with SAM..." -ForegroundColor Cyan
    & sam build --template-file template.yaml --parameter-overrides "STAGE=$Stage" | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw "sam build failed."
    }

    $logicalFunctions = @(
        "HandleVisitFunction",
        "HandleSignupFunction",
        "HandleFeedbackFunction",
        "HandleProfileFunction",
        "HandleAnalyticsFunction",
        "HandleCustomerFunction"
    )

    New-Item -ItemType Directory -Path $zipPath -Force | Out-Null

    foreach ($logicalName in $logicalFunctions) {
        $functionBuildPath = Join-Path $buildPath $logicalName
        if (-not (Test-Path $functionBuildPath)) {
            throw "Expected SAM build folder not found: $functionBuildPath"
        }

        $functionZipPath = Join-Path $zipPath "$logicalName.zip"
        if (Test-Path $functionZipPath) {
            Remove-Item $functionZipPath -Force
        }

        Compress-Archive -Path (Join-Path $functionBuildPath "*") -DestinationPath $functionZipPath -CompressionLevel Optimal
        Write-Host "Created $functionZipPath" -ForegroundColor Green
    }

    Write-Host "Lambda packages ready in $zipPath" -ForegroundColor Green
}
finally {
    Pop-Location
}
