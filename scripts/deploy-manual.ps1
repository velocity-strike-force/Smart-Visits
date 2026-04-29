param(
    [string]$Stage = "dev",
    [string]$Region = "us-east-1",
    [string]$Profile = "",
    [switch]$SkipTests,
    [switch]$SkipPackage,
    [switch]$DeployFrontend,
    [string]$StaticBucket = "",
    [string]$DistributionId = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Invoke-AwsCli {
    param([string[]]$Arguments)

    if ($Profile) {
        $Arguments += @("--profile", $Profile)
    }

    & aws @Arguments | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI command failed: aws $($Arguments -join ' ')"
    }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$serverPath = Join-Path $repoRoot "server"
$clientPath = Join-Path $repoRoot "client"

if (-not $SkipTests) {
    Push-Location $serverPath
    try {
        Write-Host "Installing server dependencies..." -ForegroundColor Cyan
        & npm ci | Out-Host
        if ($LASTEXITCODE -ne 0) { throw "npm ci failed in server/." }

        Write-Host "Running server tests..." -ForegroundColor Cyan
        & npm test | Out-Host
        if ($LASTEXITCODE -ne 0) { throw "npm test failed in server/." }
    }
    finally {
        Pop-Location
    }
}

if (-not $SkipPackage) {
    & (Join-Path $PSScriptRoot "package-lambdas.ps1") -Stage $Stage
}

$zipDir = Join-Path $serverPath ".aws-sam\zips"
$functionMap = @(
    @{ Logical = "HandleVisitFunction";     Name = "smart-visits-$Stage-handle-visit" },
    @{ Logical = "HandleSignupFunction";    Name = "smart-visits-$Stage-handle-signup" },
    @{ Logical = "HandleFeedbackFunction";  Name = "smart-visits-$Stage-handle-feedback" },
    @{ Logical = "HandleProfileFunction";   Name = "smart-visits-$Stage-handle-profile" },
    @{ Logical = "HandleAnalyticsFunction"; Name = "smart-visits-$Stage-handle-analytics" },
    @{ Logical = "HandleCustomerFunction";  Name = "smart-visits-$Stage-handle-customer" }
)

foreach ($fn in $functionMap) {
    $zipFile = Join-Path $zipDir "$($fn.Logical).zip"
    if (-not (Test-Path $zipFile)) {
        throw "Missing zip artifact: $zipFile"
    }

    Write-Host "Updating Lambda code: $($fn.Name)" -ForegroundColor Cyan
    Invoke-AwsCli -Arguments @(
        "lambda", "update-function-code",
        "--function-name", $fn.Name,
        "--zip-file", "fileb://$zipFile",
        "--publish",
        "--region", $Region
    )
}

if ($DeployFrontend) {
    if (-not $StaticBucket) {
        throw "StaticBucket is required when -DeployFrontend is set."
    }

    Push-Location $clientPath
    try {
        Write-Host "Installing client dependencies..." -ForegroundColor Cyan
        & npm ci | Out-Host
        if ($LASTEXITCODE -ne 0) { throw "npm ci failed in client/." }

        Write-Host "Building client..." -ForegroundColor Cyan
        & npm run build | Out-Host
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed in client/." }
    }
    finally {
        Pop-Location
    }

    Write-Host "Syncing client build to s3://$StaticBucket..." -ForegroundColor Cyan
    Invoke-AwsCli -Arguments @(
        "s3", "sync",
        (Join-Path $clientPath "dist"),
        "s3://$StaticBucket",
        "--delete",
        "--region", $Region
    )

    if ($DistributionId) {
        Write-Host "Creating CloudFront invalidation..." -ForegroundColor Cyan
        Invoke-AwsCli -Arguments @(
            "cloudfront", "create-invalidation",
            "--distribution-id", $DistributionId,
            "--paths", "/*"
        )
    }
}

Write-Host "Manual deployment complete." -ForegroundColor Green
