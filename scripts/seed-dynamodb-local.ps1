# Creates all Smart-Visits DynamoDB tables in DynamoDB Local and seeds deterministic data.
# Usage: .\scripts\seed-dynamodb-local.ps1
# Requires: AWS CLI (this script provides default local credentials/region if missing).

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

Write-Host ""
Write-Host "Seeding deterministic baseline records..." -ForegroundColor Cyan

function Put-LocalItem {
    param(
        [Parameter(Mandatory=$true)][string]$TableName,
        [Parameter(Mandatory=$true)][string]$ItemJson
    )

    $tempJson = New-TemporaryFile
    try {
        Set-Content -LiteralPath $tempJson.FullName -Value $ItemJson -Encoding ASCII -NoNewline
        aws dynamodb put-item `
            --endpoint-url $Endpoint `
            --table-name $TableName `
            --item "file://$($tempJson.FullName)" `
            --no-cli-pager 1>$null
    } finally {
        Remove-Item -LiteralPath $tempJson.FullName -ErrorAction SilentlyContinue
    }
}

$now = (Get-Date).ToUniversalTime().ToString("o")
$visitId = "visit-live-001"
$salesRepId = "rep-live-001"
$attendeeId = "user-live-002"
$customerId = "cust-live-marker-001"
$markerName = "LIVE_TEST_MARKER_CORP"

# Customers
Put-LocalItem -TableName "$Stage-smart-visits-Customers" -ItemJson @"
{"customerId":{"S":"$customerId"},"customerName":{"S":"$markerName"},"arr":{"N":"325000"},"implementationStatus":{"S":"Live"},"isKeyAccount":{"BOOL":true},"domain":{"S":"Manufacturing"},"primaryContactName":{"S":"Casey Marker"},"primaryContactEmail":{"S":"casey.marker@example.com"}}
"@
Put-LocalItem -TableName "$Stage-smart-visits-Customers" -ItemJson @"
{"customerId":{"S":"cust-live-002"},"customerName":{"S":"Acme Distribution"},"arr":{"N":"150000"},"implementationStatus":{"S":"Implementing"},"isKeyAccount":{"BOOL":false},"domain":{"S":"Distribution"},"primaryContactName":{"S":"Jordan Miles"},"primaryContactEmail":{"S":"jordan.miles@example.com"}}
"@

# Users
Put-LocalItem -TableName "$Stage-smart-visits-Users" -ItemJson @"
{"userId":{"S":"$salesRepId"},"name":{"S":"Taylor Rep"},"email":{"S":"taylor.rep@rfsmart.com"},"productLines":{"L":[{"S":"NetSuite"},{"S":"Shipping"}]},"city":{"S":"Jacksonville"},"state":{"S":"FL"},"emailNotifications":{"BOOL":true},"slackNotifications":{"BOOL":false},"proximityAlerts":{"BOOL":true},"proximityDistanceMiles":{"N":"50"},"createdAt":{"S":"$now"},"updatedAt":{"S":"$now"}}
"@
Put-LocalItem -TableName "$Stage-smart-visits-Users" -ItemJson @"
{"userId":{"S":"$attendeeId"},"name":{"S":"Morgan Visitor"},"email":{"S":"morgan.visitor@rfsmart.com"},"productLines":{"L":[{"S":"NetSuite"}]},"city":{"S":"Orlando"},"state":{"S":"FL"},"emailNotifications":{"BOOL":true},"slackNotifications":{"BOOL":true},"proximityAlerts":{"BOOL":false},"proximityDistanceMiles":{"N":"0"},"createdAt":{"S":"$now"},"updatedAt":{"S":"$now"}}
"@

# Visits
Put-LocalItem -TableName "$Stage-smart-visits-Visits" -ItemJson @"
{"visitId":{"S":"$visitId"},"productLine":{"S":"NetSuite"},"location":{"S":"Jacksonville, FL"},"city":{"S":"Jacksonville"},"state":{"S":"FL"},"salesRepId":{"S":"$salesRepId"},"salesRepName":{"S":"Taylor Rep"},"domain":{"S":"Manufacturing"},"customerId":{"S":"$customerId"},"customerName":{"S":"$markerName"},"customerARR":{"N":"325000"},"customerImplementationStatus":{"S":"Live"},"isKeyAccount":{"BOOL":true},"startDate":{"S":"2026-05-15"},"endDate":{"S":"2026-05-16"},"capacity":{"N":"5"},"invitees":{"L":[{"S":"$attendeeId"}]},"customerContactRep":{"S":"Casey Marker"},"purposeForVisit":{"S":"Quarterly Business Review"},"visitDetails":{"S":"Closed-toed shoes required."},"isDraft":{"BOOL":false},"isPrivate":{"BOOL":false},"createdAt":{"S":"$now"},"updatedAt":{"S":"$now"}}
"@

# Signups
Put-LocalItem -TableName "$Stage-smart-visits-Signups" -ItemJson @"
{"visitId":{"S":"$visitId"},"userId":{"S":"$attendeeId"},"userName":{"S":"Morgan Visitor"},"userEmail":{"S":"morgan.visitor@rfsmart.com"},"signedUpAt":{"S":"$now"}}
"@

# Feedback
Put-LocalItem -TableName "$Stage-smart-visits-Feedback" -ItemJson @"
{"visitId":{"S":"$visitId"},"userId":{"S":"$attendeeId"},"userName":{"S":"Morgan Visitor"},"role":{"S":"visitor"},"feedbackNotes":{"S":"Great visit and actionable outcomes."},"keyAreasOfFocus":{"L":[{"S":"Inventory accuracy"},{"S":"Receiving flow"}]},"detractors":{"S":"None"},"delighters":{"S":"Clear process improvements."},"submittedAt":{"S":"$now"}}
"@

# Audit log
Put-LocalItem -TableName "$Stage-smart-visits-AuditLog" -ItemJson @"
{"entityId":{"S":"$visitId"},"timestamp":{"S":"$now"},"action":{"S":"CREATE"},"entityType":{"S":"Visit"},"userId":{"S":"$salesRepId"},"userName":{"S":"Taylor Rep"},"before":{"NULL":true},"after":{"M":{"visitId":{"S":"$visitId"},"customerName":{"S":"$markerName"}}}}
"@

Write-Host "  Baseline records upserted." -ForegroundColor Green

Write-Host ""
Write-Host "All tables seeded. Listing tables:" -ForegroundColor Cyan
aws dynamodb list-tables --endpoint-url $Endpoint --no-cli-pager

Write-Host ""
Write-Host "Live data marker check (Customers table):" -ForegroundColor Cyan
$tempKeyFile = New-TemporaryFile
try {
    Set-Content -LiteralPath $tempKeyFile.FullName -Value "{`"customerId`":{`"S`":`"$customerId`"}}" -Encoding ASCII -NoNewline
    aws dynamodb get-item `
        --endpoint-url $Endpoint `
        --table-name "$Stage-smart-visits-Customers" `
        --key "file://$($tempKeyFile.FullName)" `
        --projection-expression "customerName, arr" `
        --no-cli-pager
} finally {
    Remove-Item -LiteralPath $tempKeyFile.FullName -ErrorAction SilentlyContinue
}
