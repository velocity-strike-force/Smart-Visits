#!/usr/bin/env bash
# Creates all Smart-Visits DynamoDB tables in DynamoDB Local.
# Usage: ./scripts/seed-dynamodb-local.sh
# Requires: AWS CLI configured (any dummy credentials work for local).

set -euo pipefail

ENDPOINT="http://localhost:8000"
STAGE="${STAGE:-dev}"

echo "Seeding DynamoDB Local at $ENDPOINT (stage: $STAGE)..."

# ── Visits table (PK: visitId) ─────────────────────────────
aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-Visits" \
  --attribute-definitions \
    AttributeName=visitId,AttributeType=S \
  --key-schema \
    AttributeName=visitId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager 2>/dev/null && echo "  Created ${STAGE}-smart-visits-Visits" || echo "  ${STAGE}-smart-visits-Visits already exists"

# ── Users table (PK: userId) ──────────────────────────────
aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-Users" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager 2>/dev/null && echo "  Created ${STAGE}-smart-visits-Users" || echo "  ${STAGE}-smart-visits-Users already exists"

# ── Signups table (PK: visitId, SK: userId) ────────────────
aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-Signups" \
  --attribute-definitions \
    AttributeName=visitId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=visitId,KeyType=HASH \
    AttributeName=userId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager 2>/dev/null && echo "  Created ${STAGE}-smart-visits-Signups" || echo "  ${STAGE}-smart-visits-Signups already exists"

# ── Feedback table (PK: visitId, SK: userId) ───────────────
aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-Feedback" \
  --attribute-definitions \
    AttributeName=visitId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=visitId,KeyType=HASH \
    AttributeName=userId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager 2>/dev/null && echo "  Created ${STAGE}-smart-visits-Feedback" || echo "  ${STAGE}-smart-visits-Feedback already exists"

# ── Customers table (PK: customerId) ──────────────────────
aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-Customers" \
  --attribute-definitions \
    AttributeName=customerId,AttributeType=S \
  --key-schema \
    AttributeName=customerId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager 2>/dev/null && echo "  Created ${STAGE}-smart-visits-Customers" || echo "  ${STAGE}-smart-visits-Customers already exists"

# ── AuditLog table (PK: entityId, SK: timestamp) ──────────
aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-AuditLog" \
  --attribute-definitions \
    AttributeName=entityId,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=entityId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager 2>/dev/null && echo "  Created ${STAGE}-smart-visits-AuditLog" || echo "  ${STAGE}-smart-visits-AuditLog already exists"

# ── Roles (PK: roleId) ─────────────────────────────────────
aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-Roles" \
  --attribute-definitions \
    AttributeName=roleId,AttributeType=S \
  --key-schema \
    AttributeName=roleId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager 2>/dev/null && echo "  Created ${STAGE}-smart-visits-Roles" || echo "  ${STAGE}-smart-visits-Roles already exists"

# ── ProductLines (PK: productLineId) ───────────────────────
aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-ProductLines" \
  --attribute-definitions \
    AttributeName=productLineId,AttributeType=S \
  --key-schema \
    AttributeName=productLineId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager 2>/dev/null && echo "  Created ${STAGE}-smart-visits-ProductLines" || echo "  ${STAGE}-smart-visits-ProductLines already exists"

# ── UserProductLines (PK: userId, SK: productLineId) ────────
aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-UserProductLines" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=productLineId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=productLineId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager 2>/dev/null && echo "  Created ${STAGE}-smart-visits-UserProductLines" || echo "  ${STAGE}-smart-visits-UserProductLines already exists"

echo ""
echo "All tables seeded. Listing tables:"
aws dynamodb list-tables --endpoint-url "$ENDPOINT" --no-cli-pager
