# Smart Visits Manual Deployment Runbook (No Terraform)

This guide is for teams that create AWS resources manually and deploy application code directly with scripts.

## 1) What You Must Have Ready

### AWS resources created manually

- DynamoDB tables:
  - `<env>-smart-visits-Visits`
  - `<env>-smart-visits-Users`
  - `<env>-smart-visits-Signups`
  - `<env>-smart-visits-Feedback`
  - `<env>-smart-visits-Customers`
  - `<env>-smart-visits-AuditLog`
- Lambda functions:
  - `smart-visits-<env>-handle-visit`
  - `smart-visits-<env>-handle-signup`
  - `smart-visits-<env>-handle-feedback`
  - `smart-visits-<env>-handle-profile`
  - `smart-visits-<env>-handle-analytics`
  - `smart-visits-<env>-handle-customer`
- IAM execution role on each Lambda with permissions for:
  - CloudWatch Logs
  - DynamoDB CRUD on `<env>-smart-visits-*`
  - SSM read access if using Parameter Store
- Optional frontend resources (if deploying client):
  - S3 bucket for static assets
  - CloudFront distribution
  - ACM certificate and Route53 record
  - WAF configuration

### Local tools

- AWS CLI authenticated to the correct account
- Node.js 24.x
- SAM CLI
- PowerShell 7+ (or Windows PowerShell 5.1)

## 2) Why SAM Build Is the Best Way to Zip Lambdas

Yes, `sam build` helps and is the recommended approach here.

`sam build` creates one artifact folder per Lambda logical resource under:

`server/.aws-sam/build/<LogicalFunctionName>/`

Then those folders are zipped and published to Lambda with `aws lambda update-function-code`.

Benefits:

- Correctly captures runtime dependencies from `server/package.json`
- Keeps packaging consistent for all six functions
- Avoids hand-maintained zip include/exclude logic

## 3) Packaging Script

Use:

`scripts/package-lambdas.ps1`

What it does:

1. Runs `sam build` in `server/`
2. Creates zips in `server/.aws-sam/zips/`:
   - `HandleVisitFunction.zip`
   - `HandleSignupFunction.zip`
   - `HandleFeedbackFunction.zip`
   - `HandleProfileFunction.zip`
   - `HandleAnalyticsFunction.zip`
   - `HandleCustomerFunction.zip`

Run it:

```powershell
.\scripts\package-lambdas.ps1 -Stage dev
```

## 4) One-Command Backend Deploy

Use:

`scripts/deploy-manual.ps1`

Default behavior:

- Installs server dependencies
- Runs server tests
- Packages Lambda zips using SAM build
- Updates all six Lambda functions in AWS

Run backend deploy:

```powershell
.\scripts\deploy-manual.ps1 -Stage dev -Region us-east-1
```

If you use a named AWS profile:

```powershell
.\scripts\deploy-manual.ps1 -Stage dev -Region us-east-1 -Profile my-aws-profile
```

## 5) One-Command Full Deploy (Backend + Frontend)

If frontend is hosted in S3 + CloudFront:

```powershell
.\scripts\deploy-manual.ps1 `
  -Stage dev `
  -Region us-east-1 `
  -DeployFrontend `
  -StaticBucket <your-static-bucket> `
  -DistributionId <your-cloudfront-distribution-id>
```

This additionally:

- Builds `client/dist`
- Syncs it to the S3 static bucket
- Invalidates CloudFront cache (if `DistributionId` is provided)

## 6) Verify Deployment

- Verify Lambda code updated:

```powershell
aws lambda get-function --function-name smart-visits-dev-handle-visit --region us-east-1
```

- Smoke test API (through your API domain or CloudFront):

```bash
curl "https://<your-domain>/api/visit"
curl "https://<your-domain>/api/customer?q=acme"
```

- Check CloudWatch logs for function errors:
  - `/aws/lambda/smart-visits-dev-handle-visit`
  - etc.

## 7) Local Development (unchanged)

```powershell
cd server
npm install
npm run db:setup
npm run start:local
```

In another shell:

```powershell
cd client
npm install
npm run dev
```
