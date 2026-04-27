/**
 * Item shapes aligned with the Customer Visit Sign-Up app UI.
 * Store as DynamoDB attributes (camelCase keys below).
 */

export type UserRole = "visitor" | "sales_rep";

/** `{env}-smart-visits-Visits` — PK: visitId */
export interface VisitRecord {
  visitId: string;
  /** Display title (e.g. purpose or internal label). */
  //title?: string;
  customerId?: string;
  /** Denormalized customer name for search/list UIs. */
  //customerName?: string;
  startDate: string;
  endDate: string;
  productLine: string;
  location: string;
  domain: string;
  salesRepUserId: string;
  capacity: number;
  purpose?: string;
  details?: string;
  customerContact?: string;
  inviteeEmails?: string[];
  isPrivate: boolean;
  isDraft: boolean;
  /** Creator identity for edit/delete authorization. */
  creatorUserId: string;
  /** Optional ARR snapshot at post time for filtering without joining Customers. */
  arrSnapshot?: number;
  createdAt: string;
  updatedAt: string;
}

/** `{env}-smart-visits-Roles` — PK: roleId */
export interface RoleRecord {
  roleId: string;
  name: string;
  description?: string;
  sortOrder?: number;
  createdAt?: string;
}

/** `{env}-smart-visits-ProductLines` — PK: productLineId */
export interface ProductLineRecord {
  productLineId: string;
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
}

/** `{env}-smart-visits-UserProductLines` — PK: userId, SK: productLineId (user ↔ product line). */
export interface UserProductLineRecord {
  userId: string;
  productLineId: string;
  assignedAt: string;
}

/** `{env}-smart-visits-Users` — PK: userId */
export interface UserProfileRecord {
  userId: string;
  /** FK → Roles table. */
  roleId?: string;
  email: string;
  name: string;
  role: UserRole;
  /** Denormalized; canonical assignments live in UserProductLines. */
  productLines: string[];
  city?: string;
  state?: string;
  emailNotifications: boolean;
  slackNotifications: boolean;
  distanceAlerts: boolean;
  createdAt: string;
  updatedAt: string;
}

/** `{env}-smart-visits-Signups` — PK: visitId, SK: userId */
export interface VisitSignupRecord {
  visitId: string;
  userId: string;
  signedUpAt: string;
  /** e.g. active | cancelled */
  status?: "active" | "cancelled";
}

/** `{env}-smart-visits-Feedback` — PK: visitId, SK: userId */
export interface PostVisitFeedbackRecord {
  visitId: string;
  userId: string;
  notes: string;
  keyAreas: string[];
  detractors?: string;
  delighters?: string;
  /** Mirrors Feedback.tsx sales-rep vs visitor copy paths. */
  submittedAsSalesRep?: boolean;
  submittedAt: string;
  updatedAt?: string;
}

/** `{env}-smart-visits-Customers` — PK: customerId */
export interface CustomerRecord {
  customerId: string;
  name: string;
  arr?: number;
  status?: string;
  isKeyAccount?: boolean;
  updatedAt?: string;
}

/** `{env}-smart-visits-AuditLog` — PK: entityId, SK: timestamp */
export interface AuditLogRecord {
  entityId: string;
  /** ISO-8601; must be unique per entityId for the sort key (use ULID or offset if needed). */
  timestamp: string;
  action: string;
  actorUserId?: string;
  /** JSON-serializable payload: before/after, visitId, etc. */
  metadata?: Record<string, unknown>;
}
