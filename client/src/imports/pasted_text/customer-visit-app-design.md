Design a web application UI called the "Customer Visit Sign-Up App" for an internal B2B SaaS company (RF-SMART). The app allows Sales Reps to post customer visits twice a year and allows internal employees to sign up to attend. The goal is to increase visibility into sales customer visits and simplify scheduling. Design all screens listed below with a clean, professional, enterprise-friendly aesthetic (think: Salesforce / Notion / Linear style). Use a light theme with a modern component library feel. All screens should be consistent in design language.

SCREEN 1 — Main Dashboard (Default Landing Page)
Default View: Calendar view (monthly) showing posted customer visits as event blocks
Toggle: Option to switch between Calendar View and List View (top-left or inline with heading)
Calendar: Monthly view with a toggle to navigate months; each event block on the calendar shows visit name/customer
Top-right corner:
Profile icon — clicking opens a dropdown showing:
Logged-in user's name and email (read-only, non-editable)
Menu item: Account Settings (opens a modal)
Menu item: Notifications (opens a separate modal)
Filter Button (prominent, near top of dashboard):
Filter panel/drawer with the following options:
Product Line (multi-select checkboxes)
Location (text or dropdown)
ARR — Min/Max range slider or input
Sales Rep Name (searchable dropdown)
Domain (dropdown)
Customer (type-ahead search input)
Key Accounts (checkbox toggle)
"Post a Visit" CTA Button — top of page (primary action button), visible to Sales Reps
SCREEN 2 — Account Settings Modal
Triggered from the profile icon menu.

Profile Section (Visible/Editable):
Name (read-only)
Email (read-only)
Product Line (multi-select checkboxes): Oracle Cloud, NetSuite, Shipping, TMS, Demand Planning, AX
Your Location: City (text input), State (dropdown)
Notification Preferences (toggle on/off):
Email notifications (toggle)
Slack DM notifications (toggle)
Distance From Location (enable toggle — proximity-based alerts)
Save / Cancel buttons at modal footer
SCREEN 3 — Post a Visit (New Visit Form Page)
Separate full page. Accessible via:

"Post a Visit" button on the dashboard
Clicking a date on the calendar (pre-fills start/end date)
Form Fields:

Product Line (dropdown — e.g., NetSuite)
Location (e.g., Jacksonville, FL — text input)
Sales Rep Name (profile-driven, pre-filled, but modifiable)
Domain (dropdown)
Customer (type-ahead search)
Auto-populates metadata chips/badges below: ARR, Implementation Status, Key Account indicator
Start Date & End Date (date pickers — pre-filled if entered from calendar)
Capacity (number input — max attendees)
List of Invitees (multi-select or tag input — searchable by name/email)
Customer Contact Rep (text or searchable input)
Purpose for Visit (text input or dropdown)
Visit Details / Requirements (free-form text area — e.g., "Closed-toed shoes required")
Private Event? (toggle)
Save as Draft button (secondary) — visible only to creator; no notifications sent; shows draft visual indicator badge
Post Visit button (primary) — triggers success toast and redirects to main dashboard, defaulting to the month of the new visit
SCREEN 4 — Visit Detail Page (View Visit)
Context-aware: Shows different options based on user role.

For Visitors (non-creator):

Full read-only view of visit details
Sign Up / Join button (with capacity indicator)
Option to contribute notes (stretch)
Cancel Sign-Up button (if already signed up)
For Creators (Sales Rep who posted):

Full editable view
Edit Visit button
Delete Invitees (manage attendee list)
Cancel Event button (triggers email to all invitees)
Visitor restrictions settings: Product Line restriction toggle
Draft badge indicator if visit is still in draft
Email Behavior (shown as notification banners or info callouts in the UI):

On Edit or Delete: email notification automatically sent to invitees
SCREEN 5 — Post-Visit Feedback Page
Separate page, accessible after visit date has passed (via email link or app notification).

For Visitors:

Visit summary/info section (read-only)
Feedback Notes textbox (required to receive visit credit)
Submit button
For Sales Reps:

Visit summary/info section (read-only)
Feedback Notes textbox
Key Areas of Focus (structured input or tags)
Detractors (text area)
Delighters (text area)
Submit button
SCREEN 6 — Analytics Dashboard
A reporting/insights view for managers.

Metrics & Visualizations to include:

Top Customers by Visit Count (bar chart or leaderboard)
Top Sales Reps by Visit Count
Manager Report — Total number of visits (with date range filter)
Manager → Direct Report drill-down view (table or hierarchy view)
Least Visited Customers (highlight/flag)
NOTIFICATIONS (Design as Notification Templates / Toast Components)
Email — Auto-sent to creator and invitees upon visit posting; contains visit details + link to Visit Detail page
Slack — Auto-sent to Slack channel configured in profile; contains notification + link (stretch: Slack bot interaction)
Proximity Alert — Backend-triggered; sent via email and/or Slack when a new visit is near the user's saved location; contains visit info + link
DESIGN REQUIREMENTS
Style: Clean, modern, enterprise SaaS (Light theme preferred)
Component consistency: Reusable card, modal, badge, toast, and form components throughout
Responsive: Optimized for desktop; mobile-friendly is a plus
Draft visual indicator: Use a distinct badge/label (e.g., muted color + "Draft" tag) on all draft visits
Toast notifications: Success, warning, and error states
Accessibility: Sufficient color contrast, clear labels on all form fields
Empty states: Design empty state screens for: no visits this month, no filter results, no feedback submitted yet
