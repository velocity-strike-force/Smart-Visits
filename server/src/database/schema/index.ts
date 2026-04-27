export {
  smartVisitsTableName,
  smartVisitsTables,
  type DeploymentEnv,
  type SmartVisitsLogicalTable,
} from "./tableNames";
export {
  SMART_VISITS_KEY_SCHEMAS,
  getKeySchema,
  type TableKeySchema,
} from "./keySchemas";
export {
  buildSmartVisitsTableDefinitions,
  type DynamoTableDefinition,
} from "./tableDefinitions";
export type {
  VisitRecord,
  UserProfileRecord,
  VisitSignupRecord,
  PostVisitFeedbackRecord,
  CustomerRecord,
  AuditLogRecord,
  UserRole,
  RoleRecord,
  ProductLineRecord,
  UserProductLineRecord,
} from "./entities";
