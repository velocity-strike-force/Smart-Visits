# Serverless Full-Stack Architecture Blueprint

This document describes every layer of the Serverless-License-Manager architecture. Use it as a step-by-step guide to scaffold a new project with the same patterns, conventions, and AWS topology.

Replace `<your-app>` throughout with the actual application name (e.g. `inventory-manager`).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Repository Structure](#2-repository-structure)
3. [Server (Backend)](#3-server-backend)
4. [Client (Frontend)](#4-client-frontend)
5. [Infrastructure (Terraform)](#5-infrastructure-terraform)
6. [Build and Deploy Pipeline](#6-build-and-deploy-pipeline)
7. [Local Development](#7-local-development)
8. [Quick-Start Checklist](#8-quick-start-checklist)

---

## 1. Architecture Overview

The system is a serverless single-page application with this topology:

```
Browser (Vite + React SPA)
    |
    | HTTPS
    v
WAFv2 (IP allowlist, block by default)
    |
    v
CloudFront Distribution (single entry point)
    |
    |-- /index.html, /assets/*  -->  S3 Bucket (private, OAC)
    |
    |-- /api/*                  -->  Lambda Function URLs (IAM auth, OAC)
                                       |
                                       |-- DynamoDB (data)
                                       |-- SSM Parameter Store (secrets)
                                       |-- Auth0 Management API (optional)

Browser  -- MSAL login redirect -->  Azure AD / Entra (authentication)
```

**Key design decisions:**

- **CloudFront is the single entry point.** Both the SPA and all API calls go through the same domain. No separate API subdomain.
- **Lambda function URLs (not API Gateway) in production.** Each Lambda gets its own function URL. CloudFront routes each `/api/<path>` to the corresponding function URL origin via ordered cache behaviors.
- **API Gateway (SAM HttpApi) for local dev only.** SAM local provides a unified `localhost:3000` for all endpoints during development.
- **WAFv2 with IP allowlist.** Default action is `block`; only allow-listed CIDRs can reach the app.
- **Azure AD (MSAL) for browser authentication.** Role-based access control via Entra app roles on `idTokenClaims`.
- **DynamoDB tables are provisioned separately** (not in this repo's Terraform). Lambda IAM policies grant access by table name pattern.

---

## 2. Repository Structure

This is a two-project monorepo with no workspace manager (no root `package.json`). Each project has its own `package.json` and dependency tree.

```
<your-app>/
  .gitignore
  README.md                              # Local dev setup guide
  .vscode/
    settings.json
  client/                                # Vite + React SPA
    .gitignore
    README.md
    env.example                          # VITE_* environment variables
    package.json
    tsconfig.json                        # Solution-style references
    tsconfig.app.json
    tsconfig.node.json
    vite.config.ts
    eslint.config.js
    index.html
    src/
      ...
  server/                                # AWS SAM + Lambda handlers
    .gitignore
    README.md
    package.json
    tsconfig.json
    template.yaml                        # SAM template (local dev + CI)
    samconfig.toml                       # Per-environment SAM profiles
    buildspec.yml                        # CodeBuild packaging
    events/                              # Sample Lambda event JSON files
    __tests__/
    src/
      ...
  terraform/                             # Production infrastructure
    README.md                            # Runbook for adding endpoints
    <your-app>/
      *.tf
      .scripts/                          # apply.sh, plan.sh, destroy.sh
  scripts/                               # CI helpers (TeamCity, Terraform wrappers)
```

---

## 3. Server (Backend)

### 3.1 Project Setup

| Setting | Value |
|---------|-------|
| Runtime | Node.js (`nodejs24.x`) |
| Language | TypeScript via `ts-node` (transpile-only, not pre-compiled) |
| Module system | CommonJS |
| Framework | AWS SAM (no Express/Fastify) |
| Test runner | Jest with `--experimental-vm-modules` |

**`server/package.json`** -- key dependencies:

```json
{
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.x",
    "@aws-sdk/client-ssm": "^3.x",
    "@aws-sdk/lib-dynamodb": "^3.x",
    "@types/aws-lambda": "^8.x",
    "lodash": "^4.x",
    "ts-node": "^10.x",
    "typescript": "^5.x"
  },
  "devDependencies": {
    "aws-sdk-client-mock": "^2.x",
    "jest": "^29.x"
  },
  "scripts": {
    "test": "node --experimental-vm-modules ./node_modules/jest/bin/jest.js"
  }
}
```

**`server/tsconfig.json`** -- essential settings:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "allowJs": true,
    "strict": true,
    "baseUrl": ".",
    "outDir": "./node_modules/dist",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "sourceMap": true
  },
  "exclude": ["node_modules"],
  "include": ["**/*.ts", "**/*.d.ts", "**/*.json"]
}
```

### 3.2 Directory Layout

```
server/src/
  handlers/
    ApiGatewayLambdaHandler.ts       # Base class (shared by all handlers)
    account.js                       # JS shim (SAM entry point)
    AccountHandler.ts                # TypeScript handler class
    <domain>.js                      # One JS shim per domain...
    <Domain>Handler.ts               # ...paired with one TS class
  services/
    AuditLoggerService.ts            # Cross-cutting audit logging
    Auth0Service.ts                  # External API client (optional)
    ParameterStoreService.ts         # SSM parameter fetcher
  database/
    Dynamo.ts                        # Single DynamoDB facade
    models/
      <Entity>.ts                    # Thin model classes (no ORM)
```

### 3.3 Handler Pattern

Each API endpoint maps to one Lambda function. The wiring uses a **three-file pattern**:

#### a) Base class -- `ApiGatewayLambdaHandler.ts`

Provides HTTP method dispatching and standardized responses. Copy this file as-is into every new project:

```typescript
import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";

export class ApiGatewayLambdaHandler {
    createSuccessResponse(body: any): APIGatewayProxyResult {
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(body),
        };
    }

    createErrorResponse(statusCode: number, body: any): APIGatewayProxyResult {
        return {
            statusCode: statusCode,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(body),
        };
    }

    protected handleEndpoint(
        event: APIGatewayProxyEventV2,
        handlers: { [key: string]: (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResult> }
    ) {
        try {
            const httpMethod = event?.requestContext?.http?.method?.toUpperCase();
            const handler = handlers[httpMethod];
            if (!handler) {
                return this.createSuccessResponse({
                    success: false,
                    message: `Method not allowed: ${httpMethod}`
                });
            }
            return handler(event);
        } catch (error) {
            return this.createSuccessResponse({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
```

#### b) JS shim -- the SAM handler entry point

Bootstraps `ts-node` and exports bound handler methods. Create one per domain:

```javascript
// src/handlers/<domain>.js
require('ts-node').register({
    project: require('path').join(__dirname, '../../tsconfig.json'),
    transpileOnly: true,
});

const { <Domain>Handler } = require('./<Domain>Handler');
const handler = new <Domain>Handler();

exports.handle<Domain>Endpoint = handler.handle<Domain>Endpoint.bind(handler);
```

#### c) TypeScript handler class -- business logic

Extends the base class. One public method per SAM function, each calling `this.handleEndpoint` with a method map:

```typescript
// src/handlers/<Domain>Handler.ts
import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";

export class <Domain>Handler extends ApiGatewayLambdaHandler {
    private readonly db: Dynamo;

    constructor() {
        super();
        this.db = new Dynamo({});
    }

    async handle<Domain>Endpoint(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
        return this.handleEndpoint(event, {
            GET: this.getItems.bind(this),
            POST: this.createItem.bind(this),
        });
    }

    private async getItems(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
        const params = event.queryStringParameters;
        // ... business logic using this.db ...
        return this.createSuccessResponse({ items: result });
    }

    private async createItem(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> {
        const body = JSON.parse(event.body ?? '{}');
        // ... business logic using this.db ...
        return this.createSuccessResponse({ success: true });
    }
}
```

### 3.4 Database Layer

`Dynamo.ts` is a single facade class for all DynamoDB operations:

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand,
    PutCommand, UpdateCommand, DeleteCommand, BatchWriteCommand
} from "@aws-sdk/lib-dynamodb";

export class Dynamo {
    private readonly client: DynamoDBDocumentClient;

    private readonly Tables = {
        // Map logical names to actual DynamoDB table names
        MY_TABLE: '<env>-<your-app>-MyTable',
    };

    constructor(ctorParams: { client?: DynamoDBDocumentClient }) {
        const { client } = ctorParams;
        this.client = client ?? DynamoDBDocumentClient.from(new DynamoDBClient({}));
    }

    // Domain-specific methods that return model instances
    async getItem(id: string): Promise<MyModel | undefined> {
        const command = new GetCommand({
            TableName: this.Tables.MY_TABLE,
            Key: { id },
        });
        const result = await this.client.send(command);
        return result.Item ? new MyModel(result.Item) : undefined;
    }

    // Paginated scan pattern used throughout
    async getAllItems(): Promise<MyModel[]> {
        let items: Array<Record<string, any>> = [];
        let startKey: Record<string, any> | undefined;
        do {
            const command = new ScanCommand({
                TableName: this.Tables.MY_TABLE,
                ExclusiveStartKey: startKey,
            });
            const result = await this.client.send(command);
            if (result.Items) items.push(...result.Items);
            startKey = result.LastEvaluatedKey;
        } while (startKey);

        return items.map(item => new MyModel(item));
    }
}
```

**Models** are thin classes that map DynamoDB item attributes to typed fields:

```typescript
// src/database/models/MyModel.ts
export interface MyModelData {
    id: string;
    name: string;
    createdAt: string;
}

export class MyModel {
    readonly id: string;
    readonly name: string;
    readonly createdAt: Date;

    constructor(data: MyModelData) {
        this.id = data.id;
        this.name = data.name;
        this.createdAt = new Date(data.createdAt);
    }
}
```

### 3.5 Services

Services handle cross-cutting concerns. They are injected into handler constructors.

| Service | Purpose | Pattern |
|---------|---------|---------|
| `ParameterStoreService` | Fetches secrets from SSM (`/your-app/*`) | Singleton, `init()` loads params once |
| `AuditLoggerService` | Captures diffs between before/after states, buffers writes, flushes to DynamoDB | Default-exported singleton |
| `Auth0Service` | Wraps Auth0 Management API for user operations | Instantiated after SSM params are loaded |

### 3.6 SAM Template

`server/template.yaml` defines all Lambda functions for local development and CI packaging:

```yaml
AWSTemplateFormatVersion: 2010-09-09
Transform:
- AWS::Serverless-2016-10-31

Parameters:
  STAGE:
    Type: String
    Default: dev

Globals:
  Function:
    Architectures:
      - x86_64
    LoggingConfig:
      LogFormat: JSON
      SystemLogLevel: DEBUG
    MemorySize: 128
    Runtime: nodejs24.x
    Timeout: 100
    Tracing: Active
  Api:
    Cors:
      AllowHeaders: "'*'"
      AllowMethods: "'GET, POST, OPTIONS'"
      AllowOrigin: "'*'"
    TracingEnabled: true

Resources:
  # One function per endpoint. Pattern:
  Handle<Name>Function:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: <your-app>-${STAGE}-handle-<name>
      CodeUri: ./
      Handler: src/handlers/<domain>.handle<Name>Endpoint
      Events:
        GetApi:
          Type: HttpApi
          Properties:
            Path: /api/<name>
            Method: GET
        PostApi:                      # Include only if POST is needed
          Type: HttpApi
          Properties:
            Path: /api/<name>
            Method: POST
```

**`server/samconfig.toml`** defines deploy profiles per environment:

```toml
[default.local_start_api.parameters]
warm_containers = "EAGER"

[netsuite_dev.deploy.parameters]
stack_name = "<your-app>"
parameter_overrides = "STAGE=\"dev\""

[netsuite_test.deploy.parameters]
stack_name = "<your-app>-test"
parameter_overrides = "STAGE=\"test\""

[netsuite_prod.deploy.parameters]
stack_name = "<your-app>-prod"
parameter_overrides = "STAGE=\"prod\""
```

---

## 4. Client (Frontend)

### 4.1 Project Setup

| Setting | Value |
|---------|-------|
| Framework | React 19 |
| Build tool | Vite 6 with `@vitejs/plugin-react` |
| Router | React Router 7 (`BrowserRouter` + `Routes`) |
| UI library | MUI (Material UI) + MUI Joy + Emotion |
| Auth | MSAL for Azure AD / Entra |
| Linting | ESLint 9 flat config with `typescript-eslint` |

**`client/package.json`** -- key dependencies:

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@azure/msal-browser": "^4.x",
    "@azure/msal-react": "^3.x",
    "@emotion/react": "^11.x",
    "@emotion/styled": "^11.x",
    "@mui/joy": "^5.x",
    "@mui/material": "^7.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "react-router": "^7.x",
    "react-toastify": "^11.x",
    "lodash": "^4.x"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.x",
    "eslint": "^9.x",
    "typescript": "~5.7.x",
    "typescript-eslint": "^8.x",
    "vite": "^6.x"
  }
}
```

### 4.2 Directory Layout

```
client/src/
  main.tsx                   # Entry: BrowserRouter wraps App
  App.tsx                    # Routes, AppContext provider, layout shell
  App.css                    # Global CSS variables (:root)
  Header.tsx                 # Navigation drawer with Links
  contexts.ts                # createContext for AppContext
  types.ts                   # All shared TypeScript types
  api/
    Api.ts                   # Base class: get<T>() / post<T>() with fetch
    <Domain>Api.ts           # One per backend domain, extends Api
  auth/
    msalConfig.ts            # MSAL configuration from VITE_* env vars
    AuthContext.ts            # React context for auth state
    AuthProvider.tsx          # MSAL initialization, login/logout, token management
    Permission.ts            # Role enum + Permission class
  components/
    ProtectedRoute.tsx       # Auth gate + optional role check
    Login.tsx                # Unauthenticated landing page
    themes/
      mui.tsx                # createTheme with CSS variable overrides
    modals/                  # Feature-specific modal dialogs
  hooks/
    useAuth.ts               # useContext(AuthContext) shorthand
  pages/
    <Page>.tsx               # One per route
```

### 4.3 Vite Configuration

Development proxy routes all `/api` calls to SAM local:

```typescript
// client/vite.config.ts
import { defineConfig, UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
    let config: UserConfig = {
        plugins: [react()],
    }

    if (process.env.NODE_ENV === 'development') {
        config = {
            ...config,
            server: {
                allowedHosts: ['localhost', '127.0.0.1'],
                proxy: {
                    '/api': {
                        target: 'http://127.0.0.1:3000',
                        secure: false,
                    },
                },
            },
        }
    }

    return config;
});
```

### 4.4 API Layer

The API layer uses class inheritance. A base `Api` class provides typed `get` and `post` methods with unified error handling:

```typescript
// client/src/api/Api.ts
import { ApiResponse } from "../types";

export class Api {
    protected async get<T extends ApiResponse>(
        url: string,
        queryParams?: Record<string, string>
    ): Promise<T> {
        let apiResponse: T;
        try {
            const queryString = queryParams
                ? `?${new URLSearchParams(queryParams).toString()}`
                : '';
            const response = await fetch(`${url}${queryString}`);
            const json = await response.json();
            apiResponse = { success: true, url, ...json };
        } catch (error) {
            apiResponse = { success: false, url, error: error as Error } as T;
            console.error(apiResponse);
        }
        return apiResponse;
    }

    protected async post<T extends ApiResponse>(
        url: string,
        data: string | object
    ): Promise<T> {
        let apiResponse: T;
        try {
            const bodyStr = typeof data === 'string' ? data : JSON.stringify(data);
            const hashHex = await this.createHash(bodyStr);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-amz-content-sha256': hashHex,
                },
                body: bodyStr,
            });
            const json = await response.json();
            apiResponse = { success: true, url, ...json };
        } catch (error) {
            apiResponse = { success: false, url, error: error as Error } as T;
            console.error(apiResponse);
        }
        return apiResponse;
    }

    protected async createHash(data: string): Promise<string> {
        const bodyBytes = new TextEncoder().encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', bodyBytes);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}
```

Domain API classes extend `Api` and call relative paths:

```typescript
// client/src/api/<Domain>Api.ts
import { Api } from "./Api";

export class <Domain>Api extends Api {
    async getItems(searchQuery: string) {
        return this.get('/api/<name>', { search: searchQuery });
    }

    async createItem(data: object) {
        return this.post('/api/<name>', data);
    }
}
```

Relative URLs (e.g. `/api/account`) work in both dev (Vite proxy) and prod (same CloudFront domain).

### 4.5 Authentication (MSAL + Azure AD)

#### MSAL Configuration

```typescript
// client/src/auth/msalConfig.ts
import { Configuration, RedirectRequest } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "",
        authority: import.meta.env.VITE_AZURE_AUTHORITY
            || `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || "common"}`,
        redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
    },
};

export const redirectRequest: RedirectRequest = {
    scopes: ["openid", "profile", "email", "User.Read"],
    redirectUri: msalConfig.auth.redirectUri,
};

export const apiRequest = {
    scopes: ["api://your-api-scope/.default"],
};
```

#### Auth Context

```typescript
// client/src/auth/AuthContext.ts
import { createContext } from "react";
import { AuthContextType } from "../types";

const defaultAuthContext: AuthContextType = {
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
    login: async () => {},
    logout: async () => {},
    getAccessToken: async () => null,
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);
```

#### Auth Provider

The `AuthProvider` component wraps the entire app. It handles MSAL initialization, redirect flow, silent token acquisition, and session restoration. User roles are extracted from `idTokenClaims.roles` and mapped to a `Permission` class:

```typescript
// client/src/auth/Permission.ts
export enum Role {
    Editor = "App.Editors",
    Viewer = "App.Viewers",
}

export class Permission {
    private _roles: string[];

    constructor(roles: string[]) {
        this._roles = roles;
    }

    get roles(): string[] {
        return this._roles;
    }

    canEdit(): boolean {
        return this._roles.includes(Role.Editor);
    }
}
```

#### Protected Route

Every page route is wrapped in `ProtectedRoute`, which checks authentication state and optionally enforces role requirements:

```typescript
// client/src/components/ProtectedRoute.tsx
import { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { CircularProgress, Box, Typography } from "@mui/material";
import Login from "./Login";

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRoles?: string[];
}

const ProtectedRoute = ({ children, requiredRoles = [] }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading, user, error } = useAuth();

    if (isLoading) {
        return (
            <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (error || !isAuthenticated) {
        return <Login />;
    }

    if (requiredRoles.length > 0 && user) {
        const hasRequiredRole = requiredRoles.some(role => user.permission.roles.includes(role));
        if (!hasRequiredRole) {
            return (
                <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
                    <Typography variant="h5" color="error">Access Denied</Typography>
                </Box>
            );
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
```

### 4.6 State Management

No external state library. Two React contexts:

1. **`AuthContext`** -- authentication state, login/logout, token access
2. **`AppContext`** -- domain data (`useState` in `App.tsx`, passed via context provider)

```typescript
// client/src/contexts.ts
import { createContext } from "react";
import { AppContextType } from "./types";

const initialAppContext = {
    items: [],
    setItems: () => {},
    isApplicationLoading: false,
    setIsApplicationLoading: () => {},
};

export const AppContext = createContext<AppContextType>(initialAppContext);
```

### 4.7 Styling

- Global CSS variables defined in `:root` in `App.css`
- MUI theme in `components/themes/mui.tsx` references those CSS variables
- MUI Joy's `CssVarsProvider` wraps the app for dark/light mode support
- No Tailwind, no CSS Modules

### 4.8 Environment Variables

`client/env.example` (copy to `.env.local`):

```bash
# Required: Azure AD app registration values
VITE_AZURE_CLIENT_ID=your-client-id-here
VITE_AZURE_TENANT_ID=your-tenant-id-here

# Optional overrides
# VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
# VITE_AZURE_REDIRECT_URI=http://localhost:5173
```

Only `VITE_`-prefixed variables are exposed to the browser by Vite.

### 4.9 App Entry and Routing

```typescript
// client/src/main.tsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <App />
    </BrowserRouter>,
);
```

Routes are declared in `App.tsx`, each wrapped in `ProtectedRoute`:

```tsx
<Routes>
    <Route path="/" element={
        <ProtectedRoute><HomePage /></ProtectedRoute>
    } />
    <Route path="/admin" element={
        <ProtectedRoute requiredRoles={[Role.Editor]}>
            <AdminPage />
        </ProtectedRoute>
    } />
</Routes>
```

---

## 5. Infrastructure (Terraform)

### 5.1 File Layout

```
terraform/<your-app>/
  __main.tf           # Providers (aws, aws.ns-route53), default tags
  backend.tf          # S3 backend (key injected by CI)
  _data.tf            # External env data, Route53 zone, IAM policy documents
  variable.tf         # Inputs and locals (app name, domains, buckets, lambda config)
  lambda.tf           # One module per Lambda function
  cloudfront.tf       # Distribution with S3 + Lambda URL origins
  s3.tf               # Static bucket, lambda zips bucket, logs bucket
  acm.tf              # TLS certificate with DNS validation
  route53.tf          # A record aliased to CloudFront
  waf.tf              # WAFv2 IP allowlist
  vpc.tf              # VPC + subnet (if needed)
  security.tf         # Security group
  cloudwatch.tf       # Log groups
  output.tf           # Domain and CDN outputs
  .scripts/           # apply.sh, plan.sh, destroy.sh, init.sh
```

### 5.2 Provider and Backend

```hcl
# __main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  default_tags {
    tags = {
      Name        = local.app_name
      Environment = data.external.env.result.AWS_ENVIRONMENT
      CreatedBy   = "Terraform"
    }
  }
}

# Separate provider for Route53 if zone is in another account
provider "aws" {
  alias      = "ns-route53"
  access_key = data.external.env.result.ROUTE53_AWS_ACCESS_KEY_ID
  secret_key = data.external.env.result.ROUTE53_AWS_SECRET_ACCESS_KEY
}
```

```hcl
# backend.tf -- key is injected during terraform init by CI
terraform {
  backend "s3" {}
}
```

### 5.3 Variables and Locals

```hcl
# variable.tf
variable "subdomain_name" {
  default = "ns.rfsmart.com"
  type    = string
}

variable "lambda_config" {
  type = map(number)
  default = {
    timeout  = 100
    mem_size = 128
  }
}

locals {
  env              = data.external.env.result.AWS_ENVIRONMENT
  app_name         = "${data.external.env.result.NAME}-${local.env}"
  domain_name      = "${local.app_name}.${var.subdomain_name}"
  app_domain_name  = local.domain_name
  api_domain_name  = "api.${local.domain_name}"
  bucketname       = "${data.external.env.result.NAME}-${data.external.env.result.AWS_REGION}-${local.env}-static"
  lambda_source    = "${data.external.env.result.NAME}-${data.external.env.result.AWS_REGION}-${local.env}-lambda-source-files"
  s3_origin_id     = "${local.bucketname}-origin"
  lambda_runtime   = "nodejs24.x"
  zip_files        = fileset("${path.module}/../../server/.aws-sam/zips/", "**/*.zip")
  content_types = {
    "js"   = "application/javascript"
    "css"  = "text/css"
    "html" = "text/html"
    "json" = "application/json"
    "png"  = "image/png"
    "svg"  = "image/svg+xml"
  }
}
```

### 5.4 IAM Policies (Data Sources)

Compose a single combined policy from individual documents:

```hcl
# _data.tf
data "external" "env" { program = ["jq", "-n", "env"] }
data "aws_region" "current" {}

data "aws_iam_policy_document" "dynamodb_access" {
  statement {
    sid       = "ListAndDescribe"
    effect    = "Allow"
    actions   = ["dynamodb:List*", "dynamodb:DescribeReservedCapacity*",
                 "dynamodb:DescribeLimits", "dynamodb:DescribeTimeToLive"]
    resources = ["*"]
  }
  statement {
    sid     = "SpecificTable"
    effect  = "Allow"
    actions = ["dynamodb:BatchGet*", "dynamodb:Get*", "dynamodb:Query",
               "dynamodb:Scan", "dynamodb:BatchWrite*", "dynamodb:Delete*",
               "dynamodb:Update*", "dynamodb:PutItem", "dynamodb:DescribeTable"]
    resources = [
      "arn:aws:dynamodb:*:*:table/<env>-<your-app>-*"
    ]
  }
}

data "aws_iam_policy_document" "parameter_store" {
  statement {
    effect    = "Allow"
    actions   = ["ssm:DescribeParameters", "ssm:GetParameters", "ssm:GetParametersByPath"]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "combined" {
  source_policy_documents = [
    data.aws_iam_policy_document.dynamodb_access.json,
    data.aws_iam_policy_document.parameter_store.json
  ]
}
```

### 5.5 Lambda Module Pattern

Each function uses `terraform-aws-modules/lambda/aws` with a function URL:

```hcl
# lambda.tf -- repeat this block for each endpoint
module "mod_lambda_handle_<name>" {
  source = "terraform-aws-modules/lambda/aws"

  function_name      = "${local.app_name}-handle-<name>"
  description        = "${local.app_name} handle <name>"
  handler            = "src/handlers/<domain>.handle<Name>Endpoint"
  runtime            = local.lambda_runtime
  timeout            = var.lambda_config["timeout"]
  memory_size        = var.lambda_config["mem_size"]
  logging_log_format = "JSON"

  allowed_triggers = {
    cloudfront = {
      principal  = "cloudfront.amazonaws.com"
      source_arn = aws_cloudfront_distribution.s3_distribution.arn
      action     = "lambda:InvokeFunctionUrl"
    }
  }

  attach_policy_json = true
  policy_json        = data.aws_iam_policy_document.combined.json
  cloudwatch_logs_retention_in_days = 7
  publish            = true
  authorization_type = "AWS_IAM"
  create_lambda_function_url = true
  create_package     = false
  s3_existing_package = {
    bucket = aws_s3_bucket.lambda_source_files.id
    key    = "Handle<Name>Function.zip"
  }
  depends_on = [aws_s3_object.lambda_zips]
}
```

### 5.6 CloudFront Distribution

The distribution has one S3 default origin and one origin per Lambda function URL:

```hcl
# cloudfront.tf (simplified pattern)
resource "aws_cloudfront_distribution" "s3_distribution" {
  # S3 default origin (static site)
  origin {
    domain_name              = aws_s3_bucket.source_files.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.s3_distribution.id
    origin_id                = local.s3_origin_id
  }

  # One origin per Lambda function URL
  origin {
    domain_name              = "${module.mod_lambda_handle_<name>.lambda_function_url_id}.lambda-url.${data.aws_region.current.region}.on.aws"
    origin_id                = "api-handle-<name>"
    origin_access_control_id = aws_cloudfront_origin_access_control.lambda.id
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default behavior: serve SPA from S3
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.s3_origin_id
    cache_policy_id        = data.aws_cloudfront_cache_policy.CachingOptimized.id
    viewer_protocol_policy = "redirect-to-https"
  }

  # One ordered_cache_behavior per API path
  ordered_cache_behavior {
    path_pattern               = "/api/<name>"
    allowed_methods            = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "api-handle-<name>"
    cache_policy_id            = data.aws_cloudfront_cache_policy.CachingDisabled.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.AllViewerExceptHostHeader.id
    viewer_protocol_policy     = "redirect-to-https"
  }

  # SPA routing: redirect 403/404 to index.html
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  aliases             = [local.app_domain_name]
  enabled             = true
  default_root_object = "index.html"
  web_acl_id          = aws_wafv2_web_acl.<your_app>.arn

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.<your_app>.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# OAC for S3
resource "aws_cloudfront_origin_access_control" "s3_distribution" {
  name                              = "${local.app_name}-S3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# OAC for Lambda function URLs
resource "aws_cloudfront_origin_access_control" "lambda" {
  name                              = "${local.app_name}-Lambda"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Post-deploy invalidation
resource "null_resource" "cloudfront_invalidation" {
  triggers = { always_run = timestamp() }
  provisioner "local-exec" {
    command = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.s3_distribution.id} --paths '/*'"
  }
}
```

### 5.7 S3 Buckets

Three buckets: static site assets, Lambda zips, and access logs:

```hcl
# s3.tf (key resources)
resource "aws_s3_bucket" "source_files" {
  bucket        = local.bucketname
  force_destroy = true
}

resource "aws_s3_bucket" "lambda_source_files" {
  bucket        = local.lambda_source
  force_destroy = true
}

# Upload client/dist/ to static bucket
resource "aws_s3_object" "provision_source_files" {
  for_each     = fileset("../../client/dist/", "**/*.*")
  bucket       = aws_s3_bucket.source_files.id
  key          = each.value
  source       = "../../client/dist/${each.value}"
  source_hash  = filebase64sha256("../../client/dist/${each.value}")
  content_type = lookup(local.content_types, reverse(split(".", each.key))[0], "application/octet-stream")
}

# Upload server/.aws-sam/zips/ to lambda bucket
resource "aws_s3_object" "lambda_zips" {
  for_each = { for zip in local.zip_files : zip => zip }
  bucket   = local.lambda_source
  key      = each.key
  source   = "${path.module}/../../server/.aws-sam/zips/${each.key}"
  etag     = filemd5("${path.module}/../../server/.aws-sam/zips/${each.key}")
}
```

### 5.8 WAF, ACM, Route53

```hcl
# waf.tf -- block by default, allow listed IPs only
resource "aws_wafv2_web_acl" "<your_app>" {
  name  = "${local.app_name}-WAFv2"
  scope = "CLOUDFRONT"
  default_action { block {} }

  rule {
    name     = "ip-set-rule"
    priority = 1
    action { allow {} }
    statement {
      ip_set_reference_statement {
        arn = aws_wafv2_ip_set.<your_app>.arn
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = local.app_name
      sampled_requests_enabled   = false
    }
  }
  token_domains = [local.api_domain_name, local.app_domain_name]
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = local.app_name
    sampled_requests_enabled   = false
  }
}

resource "aws_wafv2_ip_set" "<your_app>" {
  name               = "${local.app_name}-ip-set"
  scope              = "CLOUDFRONT"
  ip_address_version = "IPV4"
  addresses          = [
    # Add your office/VPN CIDRs here
  ]
}
```

```hcl
# acm.tf
resource "aws_acm_certificate" "<your_app>" {
  domain_name               = local.app_domain_name
  validation_method         = "DNS"
  subject_alternative_names = [local.api_domain_name]
  lifecycle { create_before_destroy = true }
}
```

### 5.9 Adding a New API Endpoint (Full Stack)

1. **Server:** Create handler files (`.js` shim + `.ts` class), add `Dynamo.ts` methods if needed
2. **SAM:** Add `AWS::Serverless::Function` to `template.yaml`
3. **Terraform `lambda.tf`:** Add a new `module` block
4. **Terraform `cloudfront.tf`:** Add a new `origin` block + `ordered_cache_behavior`
5. **Client:** Add `<Domain>Api.ts` method calling `/api/<new-path>`

---

## 6. Build and Deploy Pipeline

### 6.1 Artifact Flow

```
1. Build client          npm run build (in client/)      --> client/dist/
2. Build/package server  sam build + zip (in server/)    --> server/.aws-sam/zips/
3. Terraform apply       Uploads dist/ and zips/ to S3, wires Lambda + CloudFront
4. CloudFront invalidation (automatic via null_resource)
```

### 6.2 CodeBuild Spec

```yaml
# server/buildspec.yml
version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 24
    commands:
      - npm install
  build:
    commands:
      - npm run test
      - rm -rf __tests__
      - npm prune --production
      - aws cloudformation package
          --template-file template.yaml
          --s3-bucket $S3_BUCKET
          --output-template-file template-export.yml
artifacts:
  type: zip
  files:
    - template-export.yml
```

### 6.3 Environment Strategy

| Layer | How environments are separated |
|-------|-------------------------------|
| SAM | `samconfig.toml` profiles with `STAGE` parameter (dev/test/prod) |
| Terraform | `AWS_ENVIRONMENT` env var drives `local.env`, naming, and resource isolation |
| Stack naming | `<your-app>-<environment>` throughout |

---

## 7. Local Development

### Prerequisites

- AWS CLI configured with SSO
- AWS SAM CLI
- Docker or Podman (for SAM local)
- Node.js (matching the `nodejs24.x` runtime)

### Steps

```bash
# 1. Clone the repo
git clone <repo-url>
cd <your-app>

# 2. Set up the server
cd server
npm install
sam local start-api                    # Runs on port 3000

# 3. Set up the client (in a separate terminal)
cd client
cp env.example .env.local              # Fill in Azure AD values
npm install
npm run dev                            # Vite dev server on port 5173

# 4. Open http://localhost:5173
# Vite proxies /api/* requests to SAM local on port 3000
```

---

## 8. Quick-Start Checklist

Use this checklist to scaffold a new project from scratch:

- [ ] **Repository:** Create `client/`, `server/`, `terraform/<your-app>/`, `scripts/` directories
- [ ] **Server init:** Run `sam init` (Node.js template), then restructure to the handler pattern
- [ ] **Server base class:** Copy `ApiGatewayLambdaHandler.ts` into `server/src/handlers/`
- [ ] **Server database:** Create `Dynamo.ts` facade and model classes
- [ ] **Server services:** Add `ParameterStoreService.ts`, `AuditLoggerService.ts` as needed
- [ ] **Server SAM template:** Define functions in `template.yaml`, create `samconfig.toml` profiles
- [ ] **Client init:** Run `npm create vite@latest` with React + TypeScript
- [ ] **Client dependencies:** Install MUI, MSAL, React Router, react-toastify, lodash
- [ ] **Client API layer:** Create `Api.ts` base class and domain-specific API classes
- [ ] **Client auth:** Set up `msalConfig.ts`, `AuthContext.ts`, `AuthProvider.tsx`, `Permission.ts`
- [ ] **Client routing:** Add `ProtectedRoute.tsx`, define routes in `App.tsx`
- [ ] **Client env:** Create `env.example` with `VITE_AZURE_*` variables
- [ ] **Client Vite proxy:** Configure `/api` proxy to `localhost:3000`
- [ ] **Terraform providers:** Set up `__main.tf` with AWS provider and default tags
- [ ] **Terraform backend:** Configure S3 backend in `backend.tf`
- [ ] **Terraform data:** Add IAM policy documents for DynamoDB + SSM in `_data.tf`
- [ ] **Terraform variables:** Define app name, domain, lambda config in `variable.tf`
- [ ] **Terraform S3:** Create static, lambda zips, and logs buckets in `s3.tf`
- [ ] **Terraform Lambda:** Add one module per function in `lambda.tf`
- [ ] **Terraform CloudFront:** Configure distribution with S3 + Lambda URL origins in `cloudfront.tf`
- [ ] **Terraform ACM + Route53:** Set up TLS cert and DNS in `acm.tf` and `route53.tf`
- [ ] **Terraform WAF:** Configure IP allowlist in `waf.tf`
- [ ] **DynamoDB tables:** Provision tables separately and update `Dynamo.ts` table names
- [ ] **CI/CD:** Adapt `buildspec.yml` and deploy scripts for your CI system
