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
  LocationRecord,
  DomainRecord,
  PurposeRecord,
  AuditLogRecord,
  UserRole,
  RoleRecord,
  ProductLineRecord,
  UserProductLineRecord,
} from "./entities";
export {
    PRODUCT_LINES,
    CUSTOMERS,
    LOCATIONS,
    DOMAINS,
    PURPOSES,
} from "./entities";
export { Visit, type VisitData } from "./Visit";
export { User, type UserData } from "./User";
export { Signup, type SignupData } from "./Signup";
export { Feedback, type FeedbackData } from "./Feedback";
export { Customer, type CustomerData } from "./Customer";
export { Domain, type DomainData } from "./Domain";
export { AuditLog, type AuditLogData } from "./AuditLog";
export type {
  ReferenceCustomerDto,
  ReferenceDataPayload,
  ReferenceDomainDto,
  ReferenceProductLineDto,
  ReferenceRoleDto,
} from "./referenceData";
export { Role, type RoleData } from "./Role";
export { ProductLine, type ProductLineData } from "./ProductLine";
export { UserProductLine, type UserProductLineData } from "./UserProductLine";
export {
  OutlookIntegration,
  type OutlookIntegrationData,
} from "./OutlookIntegration";
export {
  CalendarEventLink,
  type CalendarEventLinkData,
} from "./CalendarEventLink";
