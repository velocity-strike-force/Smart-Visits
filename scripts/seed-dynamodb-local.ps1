# Creates all Smart-Visits DynamoDB tables in DynamoDB Local.
# Usage: .\scripts\seed-dynamodb-local.ps1
# Requires: AWS CLI configured (any dummy credentials work for local).

$ErrorActionPreference = "Stop"

$Endpoint = "http://localhost:8000"
$Stage = if ($env:STAGE) { $env:STAGE } else { "dev" }

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
    }
)

foreach ($table in $tables) {
    $attrJson = ($table.Attributes | ForEach-Object { "{`"AttributeName`":`"$($_.AttributeName)`",`"AttributeType`":`"$($_.AttributeType)`"}" }) -join ","
    $keyJson  = ($table.KeySchema  | ForEach-Object { "{`"AttributeName`":`"$($_.AttributeName)`",`"KeyType`":`"$($_.KeyType)`"}" }) -join ","

    try {
        aws dynamodb create-table `
            --endpoint-url $Endpoint `
            --table-name $table.Name `
            --attribute-definitions "[$attrJson]" `
            --key-schema "[$keyJson]" `
            --billing-mode PAY_PER_REQUEST `
            --no-cli-pager 2>$null | Out-Null
        Write-Host "  Created $($table.Name)" -ForegroundColor Green
    } catch {
        Write-Host "  $($table.Name) already exists" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "All tables seeded. Listing tables:" -ForegroundColor Cyan
aws dynamodb list-tables --endpoint-url $Endpoint --no-cli-pager
