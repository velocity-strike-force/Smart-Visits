import type { SmartVisitsLogicalTable } from "./tableNames";
import { smartVisitsTableName } from "./tableNames";
import { SMART_VISITS_KEY_SCHEMAS } from "./keySchemas";
import type { DeploymentEnv } from "./tableNames";

/** Declarative table spec for IaC generators or runtime checks. */
export interface DynamoTableDefinition {
  logicalName: SmartVisitsLogicalTable;
  tableName: string;
  partitionKey: { name: string; type: "S" | "N" | "B" };
  sortKey?: { name: string; type: "S" | "N" | "B" };
}

function def(
  env: DeploymentEnv,
  logical: SmartVisitsLogicalTable
): DynamoTableDefinition {
  const keys = SMART_VISITS_KEY_SCHEMAS[logical];
  const base: DynamoTableDefinition = {
    logicalName: logical,
    tableName: smartVisitsTableName(env, logical),
    partitionKey: { name: keys.partitionKey, type: "S" },
  };
  if (keys.sortKey) {
    base.sortKey = { name: keys.sortKey, type: "S" };
  }
  return base;
}

/** Full set of Smart Visits tables for provisioning (e.g. CDK, Terraform, console). */
export function buildSmartVisitsTableDefinitions(
  env: DeploymentEnv
): DynamoTableDefinition[] {
  return [
    def(env, "Visits"),
    def(env, "Users"),
    def(env, "Signups"),
    def(env, "Feedback"),
    def(env, "Customers"),
    def(env, "AuditLog"),
    def(env, "Roles"),
    def(env, "ProductLines"),
    def(env, "UserProductLines"),
    def(env, "ReferenceData"),
    def(env, "OutlookIntegrations"),
    def(env, "CalendarEventLinks"),
  ];
}
