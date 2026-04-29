/**
 * Smart Visits DynamoDB table name pattern: `{env}-smart-visits-{LogicalName}`.
 * `env` is typically `dev`, `staging`, or `prod`.
 */
export type DeploymentEnv = string;

const PREFIX = "smart-visits";

export type SmartVisitsLogicalTable =
  | "Visits"
  | "Users"
  | "Signups"
  | "Feedback"
  | "Customers"
  | "AuditLog"
  | "Roles"
  | "ProductLines"
  | "UserProductLines"
  | "ReferenceData"
  | "OutlookIntegrations"
  | "CalendarEventLinks";

export function smartVisitsTableName(
  env: DeploymentEnv,
  logical: SmartVisitsLogicalTable
): string {
  return `${env}-${PREFIX}-${logical}`;
}

/** Resolved table names for a single environment. */
export function smartVisitsTables(env: DeploymentEnv) {
  return {
    visits: smartVisitsTableName(env, "Visits"),
    users: smartVisitsTableName(env, "Users"),
    signups: smartVisitsTableName(env, "Signups"),
    feedback: smartVisitsTableName(env, "Feedback"),
    customers: smartVisitsTableName(env, "Customers"),
    auditLog: smartVisitsTableName(env, "AuditLog"),
    roles: smartVisitsTableName(env, "Roles"),
    productLines: smartVisitsTableName(env, "ProductLines"),
    userProductLines: smartVisitsTableName(env, "UserProductLines"),
    referenceData: smartVisitsTableName(env, "ReferenceData"),
    outlookIntegrations: smartVisitsTableName(env, "OutlookIntegrations"),
    calendarEventLinks: smartVisitsTableName(env, "CalendarEventLinks"),
  } as const;
}
