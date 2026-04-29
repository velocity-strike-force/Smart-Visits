# Outlook Dev Setup

Use this checklist to configure delegated Outlook calendar integration in the `dev` stage.

## 1) Entra App Registration

Configure delegated Microsoft Graph permissions:

- `Calendars.ReadWrite`
- `User.Read`
- `offline_access`

Add redirect URI:

- `http://127.0.0.1:3000/api/outlook-integration` (or your deployed API URL)

## 2) Upload SSM Parameters

Set these environment variables in your shell:

- `OUTLOOK_TENANT_ID`
- `OUTLOOK_CLIENT_ID`
- `OUTLOOK_CLIENT_SECRET`
- `OUTLOOK_SENDER_EMAIL`

Then run:

```bash
npm run outlook:configure:dev
```

The script writes to:

- `/smart-visits/dev/outlook/tenant-id`
- `/smart-visits/dev/outlook/client-id`
- `/smart-visits/dev/outlook/client-secret`
- `/smart-visits/dev/outlook/sender-email`

## 3) Local Runtime Values

`env.local.json` includes:

- `FrontendBaseUrl`
- `OutlookOAuthRedirectUri`
- `OutlookCalendarTimeZone`

Start local API:

```bash
npm run start:local
```
