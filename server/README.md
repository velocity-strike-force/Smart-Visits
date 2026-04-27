# Smart-Visits Server

AWS SAM + Lambda backend for the Customer Visit Sign-Up App.

## Prerequisites

- Node.js 24.x
- AWS SAM CLI
- Docker (for SAM local and DynamoDB Local)
- AWS CLI (for seed scripts; dummy credentials work for local)

## Quick Start

```bash
# 1. Start DynamoDB Local (from repo root)
docker-compose up -d

# 2. Seed local tables (PowerShell)
.\scripts\seed-dynamodb-local.ps1

# 3. Install dependencies
cd server
npm install

# 4. Start SAM local API
sam local start-api --warm-containers EAGER

# 5. Test an endpoint
curl http://localhost:3000/api/visit
curl http://localhost:3000/api/customer?q=acme
```

## Testing

```bash
npm test
```

## Endpoints

| Method | Path            | Description                     |
|--------|-----------------|---------------------------------|
| GET    | /api/visit      | List visits or get by visitId   |
| POST   | /api/visit      | Create a new visit              |
| PUT    | /api/visit      | Update an existing visit        |
| DELETE | /api/visit      | Cancel/delete a visit           |
| GET    | /api/signup     | List signups for a visit        |
| POST   | /api/signup     | Sign up for a visit             |
| DELETE | /api/signup     | Cancel a signup                 |
| GET    | /api/feedback   | Get feedback for a visit        |
| POST   | /api/feedback   | Submit post-visit feedback      |
| GET    | /api/profile    | Get user profile                |
| POST   | /api/profile    | Update profile/notification prefs |
| GET    | /api/analytics  | Get analytics/reporting data    |
| GET    | /api/customer   | Search customers (type-ahead)   |
