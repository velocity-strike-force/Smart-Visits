import type { SmartVisitsLogicalTable } from './tableNames';

/** Partition / sort key attribute names per table (DynamoDB single-table style naming). */
export type TableKeySchema = {
  partitionKey: string;
  sortKey?: string;
};

export const SMART_VISITS_KEY_SCHEMAS: Record<
  SmartVisitsLogicalTable,
  TableKeySchema
> = {
  Visits: { partitionKey: 'visitId' },
  Users: { partitionKey: 'userId' },
  Signups: { partitionKey: 'visitId', sortKey: 'userId' },
  Feedback: { partitionKey: 'visitId', sortKey: 'userId' },
  Customers: { partitionKey: 'customerId' },
  AuditLog: { partitionKey: 'entityId', sortKey: 'timestamp' },
};

export function getKeySchema(logical: SmartVisitsLogicalTable): TableKeySchema {
  return SMART_VISITS_KEY_SCHEMAS[logical];
}
