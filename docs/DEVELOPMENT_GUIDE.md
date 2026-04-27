# Smart-Visits Development Guide

This guide covers every element in the project scaffold, how each piece fits together, and step-by-step instructions for implementing the next features.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Local Development Setup](#3-local-development-setup)
4. [Architecture Patterns](#4-architecture-patterns)
5. [Element Reference](#5-element-reference)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [How To: Add a New Endpoint](#7-how-to-add-a-new-endpoint)
8. [How To: Wire a Handler to DynamoDB](#8-how-to-wire-a-handler-to-dynamodb)
9. [How To: Write Tests](#9-how-to-write-tests)
10. [Next Steps — Client (React)](#10-next-steps--client-react)
11. [Next Steps — Terraform](#11-next-steps--terraform)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Project Overview

Smart-Visits is an internal app for RF-SMART that allows Sales Reps to post customer visits and internal employees to sign up to attend. The backend is a set of AWS Lambda functions fronted by API Gateway (SAM for local dev) and backed by DynamoDB.

**Tech Stack:**
- Runtime: Node.js 24.x (Lambda)
- Language: TypeScript via ts-node (transpile-only, CommonJS)
- Framework: AWS SAM (no Express/Fastify)
- Database: Amazon DynamoDB
- Local DB: DynamoDB Local (Docker)
- Testing: Jest with aws-sdk-client-mock

---

## 2. Repository Structure

```
Smart-Visits/
├── .vscode/settings.json              IDE settings
├── docker-compose.yml                 DynamoDB Local container
├── scripts/
│   ├── seed-dynamodb-local.sh         Bash seed script
│   └── seed-dynamodb-local.ps1        PowerShell seed script
├── server/
│   ├── package.json                   Dependencies and scripts
│   ├── tsconfig.json                  TypeScript configuration
│   ├── template.yaml                  SAM template (6 Lambda functions)
│   ├── samconfig.toml                 SAM deploy profiles (dev/test/prod)
│   ├── buildspec.yml                  CodeBuild CI spec
│   ├── .gitignore
│   ├── README.md
│   ├── events/                        Sample Lambda event payloads
│   │   ├── visit-get.json
│   │   └── visit-post.json
│   ├── src/
│   │   ├── handlers/                  Lambda entry points
│   │   │   ├── ApiGatewayLambdaHandler.ts   Base class (shared)
│   │   │   ├── visit.js               JS shim → VisitHandler
│   │   │   ├── VisitHandler.ts        Visit CRUD logic
│   │   │   ├── signup.js              JS shim → SignupHandler
│   │   │   ├── SignupHandler.ts       Signup logic
│   │   │   ├── feedback.js            JS shim → FeedbackHandler
│   │   │   ├── FeedbackHandler.ts     Feedback logic
│   │   │   ├── profile.js             JS shim → ProfileHandler
│   │   │   ├── ProfileHandler.ts      Profile/settings logic
│   │   │   ├── analytics.js           JS shim → AnalyticsHandler
│   │   │   ├── AnalyticsHandler.ts    Analytics aggregation
│   │   │   ├── customer.js            JS shim → CustomerHandler
│   │   │   └── CustomerHandler.ts     Customer search logic
│   │   ├── database/
│   │   │   ├── Dynamo.ts              DynamoDB facade (all table ops)
│   │   │   └── models/
│   │   │       ├── Visit.ts           Visit model + interface
│   │   │       ├── User.ts            User profile model
│   │   │       ├── Signup.ts          Signup record model
│   │   │       ├── Feedback.ts        Feedback model
│   │   │       ├── Customer.ts        Customer model
│   │   │       └── AuditLog.ts        Audit log model
│   │   └── services/
│   │       ├── AuditLoggerService.ts  Buffered audit logging
│   │       └── ParameterStoreService.ts SSM parameter fetcher
│   └── __tests__/
│       └── handlers/
│           └── VisitHandler.test.ts   Example test
├── ARCHITECTURE_BLUEPRINT.md          Reference architecture doc
├── DEVELOPMENT_GUIDE.md               This file
├── Figma_UI_Prompt_Customer_Visit_App.docx  UI spec
└── rfsmart-palette-tokens.json        Brand color tokens
```

---

## 3. Local Development Setup

### Prerequisites

| Tool            | Version  | Install                                      |
|-----------------|----------|----------------------------------------------|
| Node.js         | 24.x     | https://nodejs.org                           |
| AWS SAM CLI     | latest   | https://docs.aws.amazon.com/sam/latest/developerguide/install-sam-cli.html |
| Docker Desktop  | latest   | https://www.docker.com/products/docker-desktop |
| AWS CLI         | v2       | https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html |

For DynamoDB Local with dummy credentials, create `~/.aws/credentials` if needed:
```
[default]
aws_access_key_id = fakeMyKeyId
aws_secret_access_key = fakeSecretAccessKey
region = us-east-1
```

### Step-by-Step

```bash
# 1. Start DynamoDB Local
docker-compose up -d

# 2. Verify DynamoDB Local is running
curl http://localhost:8000    # Should return {"__type":"..."}

# 3. Create tables (PowerShell on Windows)
.\scripts\seed-dynamodb-local.ps1

# 4. Install server dependencies
cd server
npm install

# 5. Start the API locally
sam local start-api --warm-containers EAGER

# 6. Test endpoints (in another terminal)
curl http://localhost:3000/api/visit
curl http://localhost:3000/api/customer?q=acme
curl http://localhost:3000/api/analytics
curl http://localhost:3000/api/profile?userId=user-001
curl "http://localhost:3000/api/signup?visitId=visit-001"
curl "http://localhost:3000/api/feedback?visitId=visit-001"
```

### Expected Responses

All endpoints return mock data out of the box. Example `GET /api/visit`:

```json
{
  "success": true,
  "visits": [
    {
      "visitId": "visit-001",
      "productLine": "NetSuite",
      "location": "Jacksonville, FL",
      "salesRepName": "Jane Smith",
      "customerName": "Acme Corp",
      "startDate": "2026-05-15",
      "endDate": "2026-05-16",
      "capacity": 5,
      "isDraft": false,
      "isKeyAccount": true
    }
  ]
}
```

---

## 4. Architecture Patterns

### Three-File Handler Pattern

Every API endpoint uses three files:

```
[JS Shim] → bootstraps ts-node → [TS Handler Class] → extends [Base Class]
```

1. **JS Shim** (`visit.js`) — SAM entry point. Registers ts-node, instantiates the handler, exports the bound method.
2. **TS Handler Class** (`VisitHandler.ts`) — Business logic. One public method dispatches HTTP methods via `handleEndpoint()`.
3. **Base Class** (`ApiGatewayLambdaHandler.ts`) — Shared by all handlers. Provides `createSuccessResponse()`, `createErrorResponse()`, and `handleEndpoint()`.

### DynamoDB Facade

`Dynamo.ts` is a single class that owns all DynamoDB operations. Handlers never import AWS SDK directly — they call `this.db.getVisitById(...)` etc. This keeps the SDK wiring in one place and makes mocking straightforward in tests.

### Model Classes

Each DynamoDB table maps to a model file with:
- A `Data` interface (matches DynamoDB item shape, all strings/numbers)
- A `Model` class (typed fields, Date conversions in constructor)

### Services

- **ParameterStoreService** — Singleton. Call `init()` once per cold start, then `get(key)` for cached SSM params.
- **AuditLoggerService** — Default-exported singleton. Call `log()` to buffer entries, `flush()` to write to DynamoDB.

---

## 5. Element Reference

### DynamoDB Tables

| Table Name Pattern                    | PK         | SK          | Purpose                        |
|---------------------------------------|------------|-------------|--------------------------------|
| `{env}-smart-visits-Visits`           | visitId    | —           | Visit records                  |
| `{env}-smart-visits-Users`            | userId     | —           | User profiles + notification prefs |
| `{env}-smart-visits-Signups`          | visitId    | userId      | Visit signup records           |
| `{env}-smart-visits-Feedback`         | visitId    | userId      | Post-visit feedback            |
| `{env}-smart-visits-Customers`        | customerId | —           | Customer lookup data           |
| `{env}-smart-visits-AuditLog`         | entityId   | timestamp   | Change audit trail             |

### Lambda Functions

| SAM Resource              | Handler File      | Path            | Methods               |
|---------------------------|-------------------|-----------------|------------------------|
| HandleVisitFunction       | visit.js          | /api/visit      | GET, POST, PUT, DELETE |
| HandleSignupFunction      | signup.js         | /api/signup     | GET, POST, DELETE      |
| HandleFeedbackFunction    | feedback.js       | /api/feedback   | GET, POST              |
| HandleProfileFunction     | profile.js        | /api/profile    | GET, POST              |
| HandleAnalyticsFunction   | analytics.js      | /api/analytics  | GET                    |
| HandleCustomerFunction    | customer.js       | /api/customer   | GET                    |

### Models (Figma Screen Mapping)

| Model      | Figma Source                  | Key Fields                                              |
|------------|-------------------------------|---------------------------------------------------------|
| Visit      | Screen 3 (Post a Visit)      | productLine, location, salesRep, customer, dates, capacity, isDraft, isPrivate |
| User       | Screen 2 (Account Settings)  | productLines, city/state, notification prefs             |
| Signup     | Screen 4 (Visit Detail)      | visitId + userId composite, signedUpAt                  |
| Feedback   | Screen 5 (Post-Visit)        | role (visitor/salesRep), notes, keyAreas, detractors, delighters |
| Customer   | Screen 3 (type-ahead search) | name, ARR, implementationStatus, isKeyAccount, domain   |
| AuditLog   | Cross-cutting                | entityId, action, before/after diffs                    |

---

## 6. Implementation Roadmap

This is the recommended order for implementing real business logic. Each phase is self-contained and testable.

### Phase 1 — Core Visit CRUD (Screens 1 + 3)

**Goal:** Replace mock data in `VisitHandler.ts` with real DynamoDB calls.

1. Open `VisitHandler.ts`
2. In `getVisits()`, replace the mock return with:
   ```typescript
   if (visitId) {
       const visit = await this.db.getVisitById(visitId);
       if (!visit) return this.createErrorResponse(404, { success: false, message: "Visit not found" });
       return this.createSuccessResponse({ success: true, visit });
   }
   const visits = await this.db.getAllVisits();
   return this.createSuccessResponse({ success: true, visits });
   ```
3. In `createVisit()`, generate a UUID and call `this.db.createVisit(...)`.
4. In `updateVisit()`, call `this.db.updateVisit(visitId, updates)`.
5. In `deleteVisit()`, call `this.db.deleteVisit(visitId)`.
6. Test against DynamoDB Local: `POST` a visit, then `GET` it back.

### Phase 2 — User Profiles (Screen 2)

**Goal:** Wire `ProfileHandler.ts` to DynamoDB.

1. Replace mock in `getProfile()` with `this.db.getUserById(userId)`.
2. Replace mock in `updateProfile()` with `this.db.createOrUpdateUser(body)`.
3. Add validation for product line values (Oracle Cloud, NetSuite, Shipping, TMS, Demand Planning, AX).

### Phase 3 — Visit Signups (Screen 4)

**Goal:** Wire `SignupHandler.ts` with capacity enforcement.

1. In `createSignup()`:
   - Fetch visit: `this.db.getVisitById(visitId)` — check capacity.
   - Count existing signups: `this.db.getSignupsForVisit(visitId)`.
   - If `signups.length >= visit.capacity`, return 409 conflict.
   - Otherwise, `this.db.putSignup(...)`.
2. In `getSignups()`, call `this.db.getSignupsForVisit(visitId)` and compute `capacityRemaining`.
3. In `cancelSignup()`, call `this.db.deleteSignup(visitId, userId)`.

### Phase 4 — Post-Visit Feedback (Screen 5)

**Goal:** Wire `FeedbackHandler.ts`.

1. In `submitFeedback()`, validate required fields by role:
   - Visitors: `feedbackNotes` required.
   - Sales Reps: `feedbackNotes` + `keyAreasOfFocus` required.
2. Call `this.db.putFeedback(body)`.
3. In `getFeedback()`, call `this.db.getFeedbackForVisit(visitId)`.

### Phase 5 — Customer Search (Screen 3 type-ahead)

**Goal:** Wire `CustomerHandler.ts` and seed customer data.

1. Add seed data to the Customers table via the seed script or a separate data load.
2. Replace mock in `searchCustomers()` with `this.db.searchCustomers(query)`.
3. Consider adding a GSI on `customerName` for efficient prefix queries if the dataset grows.

### Phase 6 — Analytics (Screen 6)

**Goal:** Wire `AnalyticsHandler.ts` with real aggregation.

1. Scan all visits and compute: top customers, top reps, total counts, least visited.
2. For performance, consider a scheduled Lambda that pre-computes and caches analytics in a summary table.

### Phase 7 — Audit Logging

**Goal:** Integrate `AuditLoggerService` into all write operations.

1. In each handler's POST/PUT/DELETE method, after the DB call:
   ```typescript
   import auditLogger from "../services/AuditLoggerService";

   auditLogger.log({
       entityId: visitId,
       action: "CREATE",
       entityType: "Visit",
       userId: body.salesRepId,
       userName: body.salesRepName,
       before: null,
       after: body,
   });
   await auditLogger.flush();
   ```

### Phase 8 — Notifications (stretch)

**Goal:** Send email/Slack notifications on key events.

1. Create `NotificationService.ts` in `services/`.
2. Trigger on: visit posted, visit edited, visit cancelled, proximity alerts.
3. Use AWS SES for email, Slack Web API for Slack messages.
4. Read configuration from user's notification preferences in the Users table.

---

## 7. How To: Add a New Endpoint

Example: adding `/api/notification` for managing notifications.

**Step 1 — Create the JS shim:**
```javascript
// server/src/handlers/notification.js
require('ts-node').register({
    project: require('path').join(__dirname, '../../tsconfig.json'),
    transpileOnly: true,
});
const { NotificationHandler } = require('./NotificationHandler');
const handler = new NotificationHandler();
exports.handleNotificationEndpoint = handler.handleNotificationEndpoint.bind(handler);
```

**Step 2 — Create the handler class:**
```typescript
// server/src/handlers/NotificationHandler.ts
import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";

export class NotificationHandler extends ApiGatewayLambdaHandler {
    async handleNotificationEndpoint(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
        return this.handleEndpoint(event, {
            GET: this.getNotifications.bind(this),
        });
    }

    private async getNotifications(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
        return this.createSuccessResponse({ success: true, notifications: [] });
    }
}
```

**Step 3 — Add to SAM template (`template.yaml`):**
```yaml
HandleNotificationFunction:
  Type: AWS::Serverless::Function
  Properties:
    FunctionName: !Sub smart-visits-${STAGE}-handle-notification
    CodeUri: ./
    Handler: src/handlers/notification.handleNotificationEndpoint
    Events:
      GetApi:
        Type: HttpApi
        Properties:
          Path: /api/notification
          Method: GET
```

**Step 4 — Restart SAM local** to pick up the new function.

---

## 8. How To: Wire a Handler to DynamoDB

This shows the transition from mock data to real DynamoDB calls using VisitHandler as an example.

**Before (mock):**
```typescript
private async getVisits(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
    // TODO: replace mock with real DynamoDB call
    return this.createSuccessResponse({
        success: true,
        visits: [{ visitId: "visit-001", ... }],
    });
}
```

**After (real):**
```typescript
private async getVisits(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
    try {
        const params = event.queryStringParameters;
        const visitId = params?.visitId;

        if (visitId) {
            const visit = await this.db.getVisitById(visitId);
            if (!visit) {
                return this.createErrorResponse(404, {
                    success: false,
                    message: "Visit not found",
                });
            }
            return this.createSuccessResponse({ success: true, visit });
        }

        const visits = await this.db.getAllVisits();
        return this.createSuccessResponse({ success: true, visits });
    } catch (error) {
        return this.createErrorResponse(500, {
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch visits",
        });
    }
}
```

**Testing against DynamoDB Local:**
```bash
# Insert a visit directly
aws dynamodb put-item \
  --endpoint-url http://localhost:8000 \
  --table-name dev-smart-visits-Visits \
  --item '{"visitId":{"S":"visit-test"},"productLine":{"S":"NetSuite"},"salesRepName":{"S":"Jane"}}'

# Fetch it via the API
curl http://localhost:3000/api/visit?visitId=visit-test
```

To make the handler use DynamoDB Local, set the `DYNAMODB_ENDPOINT` environment variable. In `template.yaml`, the Globals section already has this variable — set it to `http://host.docker.internal:8000` when running with SAM local (Docker containers access the host via `host.docker.internal`):

```yaml
Environment:
  Variables:
    STAGE: !Ref STAGE
    DYNAMODB_ENDPOINT: "http://host.docker.internal:8000"
```

---

## 9. How To: Write Tests

Tests use Jest with direct handler instantiation (no SAM/HTTP involved).

**Pattern:**
```typescript
import { VisitHandler } from "../../src/handlers/VisitHandler";

const handler = new VisitHandler();
const event = { /* APIGatewayProxyEventV2 shape */ };
const result = await handler.handleVisitEndpoint(event);
const body = JSON.parse(result.body);

expect(body.success).toBe(true);
```

**Mocking DynamoDB (for unit tests that should not hit any DB):**
```typescript
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
    ddbMock.reset();
});

it("returns a visit", async () => {
    ddbMock.on(GetCommand).resolves({
        Item: { visitId: "v1", productLine: "NetSuite", ... },
    });

    const result = await handler.handleVisitEndpoint(event);
    expect(JSON.parse(result.body).visit.visitId).toBe("v1");
});
```

**Run tests:**
```bash
cd server
npm test
```

---

## 10. Next Steps — Client (React)

When you're ready to build the frontend (per the ARCHITECTURE_BLUEPRINT):

1. `npm create vite@latest client -- --template react-ts`
2. Install dependencies: MUI, MSAL, React Router, react-toastify
3. Set up the API layer (`client/src/api/Api.ts` base class)
4. Create domain API classes: `VisitApi.ts`, `SignupApi.ts`, etc.
5. Configure Vite proxy: `/api` → `http://127.0.0.1:3000`
6. Set up MSAL auth: `msalConfig.ts`, `AuthProvider.tsx`, `ProtectedRoute.tsx`
7. Use `rfsmart-palette-tokens.json` for the MUI theme colors

The server endpoints are already structured to match what the client will need. The response shapes from the mock data match the Figma screen requirements.

---

## 11. Next Steps — Terraform

When ready for production deployment (per the ARCHITECTURE_BLUEPRINT):

1. Create `terraform/smart-visits/` directory
2. Set up provider, backend, variables
3. One `module` block in `lambda.tf` per handler (6 total)
4. CloudFront distribution with S3 origin + 6 Lambda function URL origins
5. WAF, ACM, Route53 as needed
6. IAM policies granting DynamoDB access to `*-smart-visits-*` tables

---

## 12. Troubleshooting

### SAM local won't start
- Ensure Docker is running: `docker ps`
- Check you're in the `server/` directory
- Run `sam validate` to check template syntax

### DynamoDB Local connection refused
- Verify container is running: `docker-compose ps`
- Check port 8000 is not in use: `netstat -an | findstr 8000`
- From SAM containers, use `http://host.docker.internal:8000` (not `localhost`)

### ts-node errors on Lambda invocation
- Ensure `npm install` completed in `server/`
- Check `tsconfig.json` target is ES2020 and module is CommonJS

### Tests fail with module errors
- Run with: `node --experimental-vm-modules ./node_modules/jest/bin/jest.js`
- Or just use `npm test` (already configured in package.json)

### Handler returns empty/undefined
- Check the event has `requestContext.http.method` — SAM local populates this automatically for HttpApi events
- Verify the JS shim file name matches the `Handler` property in `template.yaml`
