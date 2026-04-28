#!/usr/bin/env bash
# Creates all Smart-Visits DynamoDB tables in DynamoDB Local and seeds deterministic data.
# Usage: ./scripts/seed-dynamodb-local.sh
# Requires: AWS CLI (this script provides default local credentials/region if missing).

set -euo pipefail

ENDPOINT="http://localhost:8000"
STAGE="${STAGE:-dev}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-fakeMyKeyId}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-fakeSecretAccessKey}"
export AWS_REGION="${AWS_REGION:-us-east-1}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

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
echo "Seeding deterministic baseline records..."

VISIT_ID="visit-live-001"
SALES_REP_ID="rep-live-001"
ATTENDEE_ID="user-live-002"
CUSTOMER_ID="cust-live-marker-001"
MARKER_NAME="LIVE_TEST_MARKER_CORP"
NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

aws dynamodb put-item \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-Customers" \
  --item "{\"customerId\":{\"S\":\"${CUSTOMER_ID}\"},\"customerName\":{\"S\":\"${MARKER_NAME}\"},\"arr\":{\"N\":\"325000\"},\"implementationStatus\":{\"S\":\"Live\"},\"isKeyAccount\":{\"BOOL\":true},\"domain\":{\"S\":\"Manufacturing\"},\"primaryContactName\":{\"S\":\"Casey Marker\"},\"primaryContactEmail\":{\"S\":\"casey.marker@example.com\"}}" \
  --no-cli-pager >/dev/null

aws dynamodb put-item \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-Customers" \
  --item "{\"customerId\":{\"S\":\"cust-live-002\"},\"customerName\":{\"S\":\"Acme Distribution\"},\"arr\":{\"N\":\"150000\"},\"implementationStatus\":{\"S\":\"Implementing\"},\"isKeyAccount\":{\"BOOL\":false},\"domain\":{\"S\":\"Distribution\"},\"primaryContactName\":{\"S\":\"Jordan Miles\"},\"primaryContactEmail\":{\"S\":\"jordan.miles@example.com\"}}" \
  --no-cli-pager >/dev/null

aws dynamodb put-item \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-Users" \
  --item "{\"userId\":{\"S\":\"${SALES_REP_ID}\"},\"name\":{\"S\":\"Taylor Rep\"},\"email\":{\"S\":\"taylor.rep@rfsmart.com\"},\"productLines\":{\"L\":[{\"S\":\"NetSuite\"},{\"S\":\"Shipping\"}]},\"city\":{\"S\":\"Jacksonville\"},\"state\":{\"S\":\"FL\"},\"emailNotifications\":{\"BOOL\":true},\"slackNotifications\":{\"BOOL\":false},\"proximityAlerts\":{\"BOOL\":true},\"proximityDistanceMiles\":{\"N\":\"50\"},\"createdAt\":{\"S\":\"${NOW}\"},\"updatedAt\":{\"S\":\"${NOW}\"}}" \
  --no-cli-pager >/dev/null

aws dynamodb put-item \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-Users" \
  --item "{\"userId\":{\"S\":\"${ATTENDEE_ID}\"},\"name\":{\"S\":\"Morgan Visitor\"},\"email\":{\"S\":\"morgan.visitor@rfsmart.com\"},\"productLines\":{\"L\":[{\"S\":\"NetSuite\"}]},\"city\":{\"S\":\"Orlando\"},\"state\":{\"S\":\"FL\"},\"emailNotifications\":{\"BOOL\":true},\"slackNotifications\":{\"BOOL\":true},\"proximityAlerts\":{\"BOOL\":false},\"proximityDistanceMiles\":{\"N\":\"0\"},\"createdAt\":{\"S\":\"${NOW}\"},\"updatedAt\":{\"S\":\"${NOW}\"}}" \
  --no-cli-pager >/dev/null

aws dynamodb put-item \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-Visits" \
  --item "{\"visitId\":{\"S\":\"${VISIT_ID}\"},\"productLine\":{\"S\":\"NetSuite\"},\"location\":{\"S\":\"Jacksonville, FL\"},\"city\":{\"S\":\"Jacksonville\"},\"state\":{\"S\":\"FL\"},\"salesRepId\":{\"S\":\"${SALES_REP_ID}\"},\"salesRepName\":{\"S\":\"Taylor Rep\"},\"domain\":{\"S\":\"Manufacturing\"},\"customerId\":{\"S\":\"${CUSTOMER_ID}\"},\"customerName\":{\"S\":\"${MARKER_NAME}\"},\"customerARR\":{\"N\":\"325000\"},\"customerImplementationStatus\":{\"S\":\"Live\"},\"isKeyAccount\":{\"BOOL\":true},\"startDate\":{\"S\":\"2026-05-15\"},\"endDate\":{\"S\":\"2026-05-16\"},\"capacity\":{\"N\":\"5\"},\"invitees\":{\"L\":[{\"S\":\"${ATTENDEE_ID}\"}]},\"customerContactRep\":{\"S\":\"Casey Marker\"},\"purposeForVisit\":{\"S\":\"Quarterly Business Review\"},\"visitDetails\":{\"S\":\"Closed-toed shoes required.\"},\"isDraft\":{\"BOOL\":false},\"isPrivate\":{\"BOOL\":false},\"createdAt\":{\"S\":\"${NOW}\"},\"updatedAt\":{\"S\":\"${NOW}\"}}" \
  --no-cli-pager >/dev/null

aws dynamodb put-item \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-Signups" \
  --item "{\"visitId\":{\"S\":\"${VISIT_ID}\"},\"userId\":{\"S\":\"${ATTENDEE_ID}\"},\"userName\":{\"S\":\"Morgan Visitor\"},\"userEmail\":{\"S\":\"morgan.visitor@rfsmart.com\"},\"signedUpAt\":{\"S\":\"${NOW}\"}}" \
  --no-cli-pager >/dev/null

aws dynamodb put-item \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-Feedback" \
  --item "{\"visitId\":{\"S\":\"${VISIT_ID}\"},\"userId\":{\"S\":\"${ATTENDEE_ID}\"},\"userName\":{\"S\":\"Morgan Visitor\"},\"role\":{\"S\":\"visitor\"},\"feedbackNotes\":{\"S\":\"Great visit and actionable outcomes.\"},\"keyAreasOfFocus\":{\"L\":[{\"S\":\"Inventory accuracy\"},{\"S\":\"Receiving flow\"}]},\"detractors\":{\"S\":\"None\"},\"delighters\":{\"S\":\"Clear process improvements.\"},\"submittedAt\":{\"S\":\"${NOW}\"}}" \
  --no-cli-pager >/dev/null

aws dynamodb put-item \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-AuditLog" \
  --item "{\"entityId\":{\"S\":\"${VISIT_ID}\"},\"timestamp\":{\"S\":\"${NOW}\"},\"action\":{\"S\":\"CREATE\"},\"entityType\":{\"S\":\"Visit\"},\"userId\":{\"S\":\"${SALES_REP_ID}\"},\"userName\":{\"S\":\"Taylor Rep\"},\"before\":{\"NULL\":true},\"after\":{\"M\":{\"visitId\":{\"S\":\"${VISIT_ID}\"},\"customerName\":{\"S\":\"${MARKER_NAME}\"}}}}" \
  --no-cli-pager >/dev/null

echo "  Baseline records upserted."
echo ""
echo "All tables seeded. Listing tables:"
aws dynamodb list-tables --endpoint-url "$ENDPOINT" --no-cli-pager

echo ""
echo "Live data marker check (Customers table):"
aws dynamodb get-item \
  --endpoint-url "$ENDPOINT" \
  --table-name "${STAGE}-smart-visits-Customers" \
  --key "{\"customerId\":{\"S\":\"${CUSTOMER_ID}\"}}" \
  --projection-expression "customerName, arr" \
  --no-cli-pager
