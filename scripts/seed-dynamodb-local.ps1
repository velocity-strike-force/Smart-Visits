# Creates all Smart-Visits DynamoDB tables in DynamoDB Local and seeds data via the server
# script (all tables: Visits, Users, Signups, Feedback, Customers, AuditLog, Roles,
# ProductLines, UserProductLines, ReferenceData — see server/src/database/schema/tableNames.ts).
#
# Usage: .\scripts\seed-dynamodb-local.ps1
# Requires: AWS CLI, Node/npm with server dependencies (`npm install` in server/).
#
# Parameters:
#   -SkipFullSeed  Only create tables; do not run npm run seed:test

param(
    [switch]$SkipFullSeed
)

$ErrorActionPreference = "Stop"

$Endpoint = "http://localhost:8000"
$Stage = if ($env:STAGE) { $env:STAGE } else { "dev" }

if (-not $env:AWS_ACCESS_KEY_ID) { $env:AWS_ACCESS_KEY_ID = "fakeMyKeyId" }
if (-not $env:AWS_SECRET_ACCESS_KEY) { $env:AWS_SECRET_ACCESS_KEY = "fakeSecretAccessKey" }
if (-not $env:AWS_REGION) { $env:AWS_REGION = "us-east-1" }
if (-not $env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION = "us-east-1" }

Write-Host "Seeding DynamoDB Local at $Endpoint (stage: $Stage)..." -ForegroundColor Cyan

$tables = @(
    @{
        Name       = "$Stage-smart-visits-Visits"
        Attributes = @( @{ AttributeName = "visitId"; AttributeType = "S" } )
        KeySchema  = @( @{ AttributeName = "visitId"; KeyType = "HASH" } )
    },
    @{
        Name       = "$Stage-smart-visits-Users"
        Attributes = @( @{ AttributeName = "userId"; AttributeType = "S" } )
        KeySchema  = @( @{ AttributeName = "userId"; KeyType = "HASH" } )
    },
    @{
        Name       = "$Stage-smart-visits-Signups"
        Attributes = @(
            @{ AttributeName = "visitId"; AttributeType = "S" },
            @{ AttributeName = "userId"; AttributeType = "S" }
        )
        KeySchema  = @(
            @{ AttributeName = "visitId"; KeyType = "HASH" },
            @{ AttributeName = "userId"; KeyType = "RANGE" }
        )
    },
    @{
        Name       = "$Stage-smart-visits-Feedback"
        Attributes = @(
            @{ AttributeName = "visitId"; AttributeType = "S" },
            @{ AttributeName = "userId"; AttributeType = "S" }
        )
        KeySchema  = @(
            @{ AttributeName = "visitId"; KeyType = "HASH" },
            @{ AttributeName = "userId"; KeyType = "RANGE" }
        )
    },
    @{
        Name       = "$Stage-smart-visits-Customers"
        Attributes = @( @{ AttributeName = "customerId"; AttributeType = "S" } )
        KeySchema  = @( @{ AttributeName = "customerId"; KeyType = "HASH" } )
    },
    @{
        Name       = "$Stage-smart-visits-AuditLog"
        Attributes = @(
            @{ AttributeName = "entityId"; AttributeType = "S" },
            @{ AttributeName = "timestamp"; AttributeType = "S" }
        )
        KeySchema  = @(
            @{ AttributeName = "entityId"; KeyType = "HASH" },
            @{ AttributeName = "timestamp"; KeyType = "RANGE" }
        )
    },
    @{
        Name       = "$Stage-smart-visits-Roles"
        Attributes = @( @{ AttributeName = "roleId"; AttributeType = "S" } )
        KeySchema  = @( @{ AttributeName = "roleId"; KeyType = "HASH" } )
    },
    @{
        Name       = "$Stage-smart-visits-ProductLines"
        Attributes = @( @{ AttributeName = "productLineId"; AttributeType = "S" } )
        KeySchema  = @( @{ AttributeName = "productLineId"; KeyType = "HASH" } )
    },
    @{
        Name       = "$Stage-smart-visits-UserProductLines"
        Attributes = @(
            @{ AttributeName = "userId"; AttributeType = "S" },
            @{ AttributeName = "productLineId"; AttributeType = "S" }
        )
        KeySchema  = @(
            @{ AttributeName = "userId"; KeyType = "HASH" },
            @{ AttributeName = "productLineId"; KeyType = "RANGE" }
        )
    },
    @{
        Name       = "$Stage-smart-visits-ReferenceData"
        Attributes = @( @{ AttributeName = "domainId"; AttributeType = "S" } )
        KeySchema  = @( @{ AttributeName = "domainId"; KeyType = "HASH" } )
    }
)

foreach ($table in $tables) {
    $exists = $false
    try {
        aws dynamodb describe-table `
            --endpoint-url $Endpoint `
            --table-name $table.Name `
            --no-cli-pager 1>$null 2>$null
        $exists = $true
    } catch {
        $exists = $false
    }

    if ($exists) {
        Write-Host "  $($table.Name) already exists" -ForegroundColor Yellow
    } else {
        $attributeDefinitions = @(
            $table.Attributes | ForEach-Object {
                "AttributeName=$($_.AttributeName),AttributeType=$($_.AttributeType)"
            }
        )
        $keySchema = @(
            $table.KeySchema | ForEach-Object {
                "AttributeName=$($_.AttributeName),KeyType=$($_.KeyType)"
            }
        )

        aws dynamodb create-table `
            --endpoint-url $Endpoint `
            --table-name $table.Name `
            --attribute-definitions $attributeDefinitions `
            --key-schema $keySchema `
            --billing-mode PAY_PER_REQUEST `
            --no-cli-pager | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create table $($table.Name)"
        }
        Write-Host "  Created $($table.Name)" -ForegroundColor Green
    }
}

if (-not $SkipFullSeed) {
    Write-Host ""
    Write-Host "Running full seed (npm run seed:test from server/)..." -ForegroundColor Cyan
    $serverDir = Join-Path $PSScriptRoot "..\server"
    if (-not (Test-Path (Join-Path $serverDir "package.json"))) {
        throw "server/package.json not found at $serverDir — run from repo root."
    }
    $savedStage = $env:STAGE
    $savedDynamo = $env:DYNAMODB_ENDPOINT
    try {
        $env:STAGE = $Stage
        $env:DYNAMODB_ENDPOINT = $Endpoint
        Push-Location $serverDir
        npm run seed:test
        if ($LASTEXITCODE -ne 0) {
            throw "npm run seed:test failed (exit $LASTEXITCODE). Install deps: cd server; npm install"
        }
    } finally {
        Pop-Location
        if ($null -ne $savedStage) { $env:STAGE = $savedStage } else { Remove-Item Env:\STAGE -ErrorAction SilentlyContinue }
        if ($null -ne $savedDynamo) { $env:DYNAMODB_ENDPOINT = $savedDynamo } else { Remove-Item Env:\DYNAMODB_ENDPOINT -ErrorAction SilentlyContinue }
    }
    Write-Host "  Full seed completed." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Skipped full seed (-SkipFullSeed). Tables exist but may be empty." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Listing tables:" -ForegroundColor Cyan
aws dynamodb list-tables --endpoint-url $Endpoint --no-cli-pager

if (-not $SkipFullSeed) {
    Write-Host ""
    Write-Host "Sample check (seed customer cust-seed-00):" -ForegroundColor Cyan
    $tempKeyFile = New-TemporaryFile
    try {
        Set-Content -LiteralPath $tempKeyFile.FullName -Value "{`"customerId`":{`"S`":`"cust-seed-00`"}}" -Encoding ASCII -NoNewline
        aws dynamodb get-item `
            --endpoint-url $Endpoint `
            --table-name "$Stage-smart-visits-Customers" `
            --key "file://$($tempKeyFile.FullName)" `
            --projection-expression "customerName, arr" `
            --no-cli-pager
    } finally {
        Remove-Item -LiteralPath $tempKeyFile.FullName -ErrorAction SilentlyContinue
    }
}
