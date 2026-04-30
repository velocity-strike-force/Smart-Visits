# Outlook Integration — Browser Testing Guide

This document describes manual browser testing paths for the Outlook calendar and email integration in Smart-Visits.

---

## Pre-requisites

| Requirement | Details |
|-------------|---------|
| Client `.env` | `VITE_VISITS_DATA_SOURCE=api`, `VITE_PROFILE_USER_ID=user-seed-00` (or a valid seeded user) |
| Server running | `npm run start:local` (SAM local API on port 3000) |
| DynamoDB local | Running on port 8000 with tables created (`npm run db:setup && npm run seed:test`) |
| SSM parameters | Run `npm run outlook:configure:dev` with env vars `OUTLOOK_TENANT_ID`, `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`, `OUTLOOK_SENDER_EMAIL` |
| Entra App Registration | Redirect URI: `http://127.0.0.1:3000/api/outlook-integration`; Delegated permissions: `Calendars.ReadWrite`, `User.Read`, `offline_access`; Application permission: `Mail.Send` (admin-consented) |

---

## Path 1: Connect Outlook (Happy Path)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open dashboard, click gear icon to open **Preferences** | Modal opens; "Outlook Calendar" section shows "Not connected" |
| 2 | Click **"Connect Outlook"** | Button shows "Connecting...", browser redirects to Microsoft login |
| 3 | Log in with Microsoft account and consent to permissions | Microsoft redirects to `http://127.0.0.1:3000/api/outlook-integration?code=...&state=...` |
| 4 | Server exchanges code, redirects to `http://127.0.0.1:5173/outlook/callback?status=success` | Callback page renders: "Outlook Integration Connected" with success message |
| 5 | After ~2.5s auto-redirect, land on Dashboard | No error toasts |
| 6 | Reopen **Preferences** | Shows "Connected as {your-outlook-email}" with "Disconnect Outlook" button |

### What success means
- OAuth authorization code flow works end-to-end.
- Tokens are stored in DynamoDB.
- Frontend correctly reads connection status from the API.

### What failure means
- **Blank page at step 4:** The `/outlook/callback` route is not registered in the React Router (see Blocker section below).
- **Error at step 3:** Check Entra redirect URI matches exactly, including trailing slash.
- **"OAuth state has expired":** The 10-minute TTL passed between step 2 and step 3.

---

## Path 2: Disconnect Outlook

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open **Preferences** (already connected) | "Connected as {email}" visible |
| 2 | Click **"Disconnect Outlook"** | Button shows "Disconnecting..." |
| 3 | Observe result | Toast: "Outlook calendar disconnected"; UI reverts to "Not connected" |
| 4 | Close and reopen Preferences | Still shows "Not connected" (server state cleared) |

### What success means
- DELETE endpoint removes DynamoDB integration record and all linked calendar events.
- UI state resets without full page reload.

### What failure means
- **Toast error "Failed to disconnect":** Check server logs for Graph API errors during event cleanup.
- **UI still shows connected after reopen:** Client may be caching stale state; verify the GET status endpoint returns `connected: false`.

---

## Path 3: Calendar Event Creation on Visit Post

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Ensure Outlook is connected (complete Path 1) | — |
| 2 | Navigate to **Post Visit**, fill all fields, uncheck "Draft", submit | Visit created successfully |
| 3 | Open your Outlook calendar (web or desktop) | New event appears with customer name, product line, location, dates |
| 4 | Edit the visit in Smart-Visits (change dates or location) | — |
| 5 | Check Outlook calendar | Existing event is updated (not duplicated) |
| 6 | Delete the visit | Calendar event disappears from Outlook |

### What success means
- Graph API `POST /me/events`, `PATCH /me/events/{id}`, and `DELETE /me/events/{id}` all work.
- `CalendarEventLink` records in DynamoDB correctly track the mapping.

### What failure means
- **No event appears:** Check server logs for "Skipping Outlook calendar sync because user is not connected" — the `salesRepId` on the visit must match the connected user's `userId`.
- **Event not updated:** The `CalendarEventLink` may have a stale `eventId` pointing to a deleted event; the service should fall back to creating a new one.
- **403 from Graph:** The user's access token may lack `Calendars.ReadWrite` scope; re-consent or check Entra config.

---

## Path 4: Calendar Event on Sign-up

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Connect Outlook as a user who is NOT the visit creator | — |
| 2 | Browse to an existing visit, click **Sign Up** | Signup succeeds |
| 3 | Check that user's Outlook calendar | Calendar event for the visit appears |
| 4 | Cancel the signup | Calendar event removed |

### What success means
- `SignupHandler` correctly triggers calendar sync for the signing user (not just the visit owner).

### What failure means
- **No event on signup:** Verify the signup handler has `OUTLOOK_OAUTH_REDIRECT_URI` set in its Lambda environment.

---

## Path 5: Email Notification on Visit Creation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Ensure another user in DynamoDB has `emailNotifications: true` and matching `productLine` | — |
| 2 | Post a new non-draft visit matching that product line | — |
| 3 | Check inbox of the matching user | Email with subject "New visit available: {customer}" containing details, "View Visit Details" link, "Sign Up" link |

### What success means
- Client credentials token acquisition works.
- `Mail.Send` application permission is granted and admin-consented.
- `PreferenceMatcher` correctly filters recipients by product line and preferences.

### What failure means
- **403 "Access is denied":** `Mail.Send` application permission is not granted or not admin-consented in Entra.
- **No email but no error:** Check that the other user's `emailNotifications` is `true` and their `productLines` array includes the visit's product line (case-insensitive match).
- **Email sent to wrong people:** Review `PreferenceMatcher` logic — private visits only notify invitees.

---

## Path 6: Draft Visits Don't Trigger Anything

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Post a visit as **draft** | Visit saves successfully |
| 2 | Check Outlook calendar | No event created |
| 3 | Check email inboxes | No notification email sent |
| 4 | Edit the draft to publish it (uncheck draft, save) | Calendar event now appears; email notification sent |

### What success means
- Draft guard in `VisitHandler.dispatchVisitCalendarCreate` and `dispatchVisitCreatedNotification` works.
- Publishing triggers both flows.

---

## Path 7: Error Handling & Edge Cases

| Scenario | How to Test | Expected |
|----------|-------------|----------|
| Expired OAuth state | Click "Connect Outlook", wait 10+ minutes, then complete Microsoft login | Callback shows error: "OAuth state has expired; start connection again" |
| Revoked consent | Remove app consent at myapps.microsoft.com, then trigger a visit | Calendar sync fails silently; visit creation still succeeds |
| Invalid refresh token | Clear `refreshToken` in DynamoDB for your user, trigger a visit | Calendar sync fails gracefully; no crash |
| User without integration | Switch to a user who never connected, post a visit | No calendar event; no error; visit saves normally |
| Network failure to Graph | Disconnect internet after connecting, post a visit | Visit saves; calendar sync retries 3× then fails silently (check server logs) |
| Double-click "Connect" | Rapidly click "Connect Outlook" button | Button should be disabled during loading; only one OAuth flow starts |
| Concurrent visits | Post two visits quickly in separate tabs | Each should create separate calendar events without collision |

---

## Path 8: Permission Consent Screen Verification

| Step | Action | What to Look For |
|------|--------|------------------|
| 1 | Use a fresh Microsoft account that hasn't consented | — |
| 2 | Click "Connect Outlook" | Microsoft consent screen appears |
| 3 | Review listed permissions | Should show: "Read your profile", "Read and write your calendars", "Maintain access" |
| 4 | Verify NO Mail.Send appears | Email uses app-level permissions — users should NOT see mail access in consent |

---

## Known Blocker: Missing `/outlook/callback` Route

The `OutlookCallback` component is imported in `App.tsx` but has no `<Route>` definition. After Microsoft redirects post-OAuth, the SPA will not render the callback page.

**Fix:** Add a route for `outlook/callback` inside the existing `<Route path="/" element={<Layout />}>` block in `App.tsx`.

**Impact:** This is a one-line addition inside the router. It does not change any existing component behavior, routing, or state management. See the "Impact Analysis" section below.

---

## Impact Analysis: Adding the `/outlook/callback` Route

### What changes

A single `<Route>` element is added inside the existing layout route group:

```tsx
<Route path="outlook/callback" element={<OutlookCallback />} />
```

### What does NOT change

| Area | Impact |
|------|--------|
| Existing routes | None — no path conflicts; `outlook/callback` is a new unique path |
| Layout component | No change — `OutlookCallback` renders inside the same `<Layout />` wrapper |
| Other components | Zero — nothing references or depends on this route existing |
| State management | None — `OutlookCallback` only reads URL search params and calls `navigate("/")` |
| Bundle size | Negligible — the component is already imported (tree-shaking already includes it) |
| Build/deploy | No new dependencies; no config changes |

### Risk assessment

- **Breaking risk: None.** This is purely additive — it makes an already-imported component reachable via URL.
- **Regression risk: None.** No existing behavior is modified. Users who never visit `/outlook/callback` are unaffected.
- **The component already exists and is tested** — it reads `?status=` and `?message=` from the URL, displays a message, then auto-redirects to `/` after 2.5 seconds.

---

## Automated Test Coverage (Reference)

These browser paths complement the automated unit tests in `server/__tests__/`:

| Test File | What It Covers |
|-----------|---------------|
| `OutlookOAuthService.test.ts` | Token exchange, refresh, profile fetch, expiry logic |
| `OutlookEmailService.test.ts` | App-level token, sendMail via Graph, caching |
| `NotificationService.test.ts` | Recipient matching, email dispatch, templates |
| `OutlookIntegrationHandler.test.ts` | Connect, disconnect, status, OAuth callback validation |
| `OutlookCalendarService.test.ts` | Create/update/delete calendar events |
| `httpRetry.test.ts` | Retry logic on transient failures |
