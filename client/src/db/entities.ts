/**
 * Item shapes aligned with the Customer Visit Sign-Up app UI.
 * Store as DynamoDB attributes (camelCase keys below).
 */

export type UserRole = 'visitor' | 'sales_rep' | 'admin';

/** `{env}-smart-visits-Visits` — PK: visitId */
export interface VisitRecord {
  visitId: string;
  customerId?: string;
  startDate: string;
  endDate: string;
  productLineId: string;
  locationId: string;
  domainId: string;
  salesRepUserId: string; //userId
  capacity: number;
  purposeId?: string; //
  details?: string;
  customerContact?: string;
  isPrivate: boolean;
  isDraft: boolean;
  creatorUserId: string; //userId
  createdDateTimeUTC: string;
  updatedDateTimeUTC: string;
}

/** `{env}-smart-visits-Visits` — PK: visitId */
export interface PurposeRecord {
  purposeId: string;
  purposeDescription: string;
}

export interface DomainRecord {
  domainId: string;
  domainName: string;
}

export interface LocationRecord {
  locationId: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  address: string;
  phoneNumber: string;
  emailAddress: string;
  websiteUrl: string;
  createdDateTimeUTC: string;
  updatedDateTimeUTC?: string;
}

export interface CustomerRecord {
  customerId: string;
  customerName: string;
  locationId: string;
  arr?: number;
  status?: string;
  isKeyAccount?: boolean;
  updatedDateTimeUTC?: string;
}

export interface ProductLineRecord {
  productLineId: string;
  productLineName: string;
  productLineDescription: string;
  createdDateTimeUTC: string;
  updatedDateTimeUTC?: string;
}

/** `{env}-smart-visits-Users` — PK: userId */
export interface UserProfileRecord {
  userId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  role: UserRole;
  productLineIds: string[];
  emailNotifications: boolean;
  slackNotifications: boolean;
  distanceAlerts: boolean;
  distanceMiles: number;
  createdAt: string;
  updatedAt: string;
}

/** `{env}-smart-visits-Signups` — PK: visitId, SK: userId */
export interface VisitSignupRecord {
  visitId: string;
  userId: string;
  signedUpDateTimeUTC: string;
  statusId: string;
}

export interface StatusRecord {
  statusId: string;
  statusDescription: string;
}

/** `{env}-smart-visits-Feedback` — PK: visitId, SK: userId */
export interface PostVisitFeedbackRecord {
  visitId: string;
  userId: string;
  notes: string;
  keyAreas: string[];
  detractors?: string;
  delighters?: string;
  submittedDateTimeUTC: string;
  updatedDateTimeUTC?: string;
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
