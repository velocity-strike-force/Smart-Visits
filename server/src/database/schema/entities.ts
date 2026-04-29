/**
 * Item shapes aligned with the Customer Visit Sign-Up app UI.
 * Store as DynamoDB attributes (camelCase keys below).
 */

export type UserRole = "visitor" | "sales_rep" | "admin";

/** `{env}-smart-visits-Visits` — PK: visitId */
export interface VisitRecord {
  visitId: string;
  /** Display title (e.g. purpose or internal label). */
  //title?: string;
  customerId?: CustomerRecord;
  /** Denormalized customer name for search/list UIs. */
  //customerName?: string;
  startDate: string;
  endDate: string;
  productLine: ProductLineRecord;
  location: string;
  domain: DomainRecord;
  salesRepUserId: string;
  capacity: number;
  purpose?: PurposeRecord;
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

/**
 * Canonical product lines for the app (filters, post-visit, etc.) — hardcoded like {@link UserRole},
 * not read from the `{env}-smart-visits-ProductLines` Dynamo table.
 */
export const PRODUCT_LINES = [
  {
    productLineId: "pl-netsuite",
    name: "NetSuite",
    description: "NetSuite ERP / SCM",
    sortOrder: 10,
  },
  {
    productLineId: "pl-oracle-cloud",
    name: "Oracle Cloud",
    description: "Oracle Fusion Cloud applications",
    sortOrder: 20,
  },
  {
    productLineId: "pl-tms",
    name: "TMS",
    description: "Transportation management",
    sortOrder: 30,
  },
  {
    productLineId: "pl-shipping",
    name: "Shipping",
    description: "Shipping & fulfillment",
    sortOrder: 40,
  },
] as const;

/** One row from {@link PRODUCT_LINES}. */
export type ProductLineRecord = (typeof PRODUCT_LINES)[number];

/**
 * Canonical business domains / verticals — hardcoded like {@link UserRole},
 * not read from a Dynamo ReferenceData table (domain rows use the same IDs when seeded).
 */
export const DOMAINS = [
  {
    domainId: "dom-manufacturing",
    name: "Manufacturing",
    description: "Discrete and process manufacturing",
    sortOrder: 10,
  },
  {
    domainId: "dom-technology",
    name: "Technology",
    description: "Software and technology services",
    sortOrder: 20,
  },
  {
    domainId: "dom-logistics",
    name: "Logistics",
    description: "Transportation, warehousing, 3PL",
    sortOrder: 30,
  },
  {
    domainId: "dom-retail",
    name: "Retail",
    description: "Retail and consumer brands",
    sortOrder: 40,
  },
  {
    domainId: "dom-erp",
    name: "ERP",
    description: "Enterprise applications",
    sortOrder: 50,
  },
] as const;

/** One row from {@link DOMAINS}. */
export type DomainRecord = (typeof DOMAINS)[number];

/**
 * Canonical visit purposes — hardcoded like {@link UserRole},
 * not read from a Dynamo Purposes table.
 */
export const PURPOSES = [
  {
    purposeId: "pur-qbr",
    name: "Quarterly Business Review",
    description: "Executive QBR / relationship checkpoint",
    sortOrder: 10,
  },
  {
    purposeId: "pur-demo",
    name: "Product Demo",
    description: "Solution demonstration",
    sortOrder: 20,
  },
  {
    purposeId: "pur-implementation",
    name: "Implementation Review",
    description: "Project status and milestones",
    sortOrder: 30,
  },
  {
    purposeId: "pur-training",
    name: "Training Session",
    description: "User or admin training",
    sortOrder: 40,
  },
  {
    purposeId: "pur-discovery",
    name: "Discovery Call",
    description: "Requirements and fit assessment",
    sortOrder: 50,
  },
  {
    purposeId: "pur-support",
    name: "Support Review",
    description: "Open tickets and escalation path",
    sortOrder: 60,
  },
] as const;

/** One row from {@link PURPOSES}. */
export type PurposeRecord = (typeof PURPOSES)[number];

/** `{env}-smart-visits-UserProductLines` — PK: userId, SK: productLineId (user ↔ product line). */
export interface UserProductLineRecord {
  userId: string;
  productLineId: ProductLineRecord;
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
  productLines: ProductLineRecord[];
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

/**
 * Canonical office / market locations — hardcoded like {@link UserRole},
 * not read from a Dynamo Locations table.
 */
export const LOCATIONS = [
  {
    locationId: "loc-jacksonville-fl",
    city: "Jacksonville",
    state: "FL",
    country: "USA",
    postalCode: "32202",
    address: "1 Independent Dr",
  },
  {
    locationId: "loc-miami-fl",
    city: "Miami",
    state: "FL",
    country: "USA",
    postalCode: "33131",
    address: "200 S Biscayne Blvd",
  },
  {
    locationId: "loc-tampa-fl",
    city: "Tampa",
    state: "FL",
    country: "USA",
    postalCode: "33602",
    address: "401 E Jackson St",
  },
  {
    locationId: "loc-orlando-fl",
    city: "Orlando",
    state: "FL",
    country: "USA",
    postalCode: "32801",
    address: "400 W Livingston St",
  },
  {
    locationId: "loc-atlanta-ga",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    postalCode: "30309",
    address: "1075 Peachtree St NE",
  },
] as const;

/** One row from {@link LOCATIONS}. */
export type LocationRecord = (typeof LOCATIONS)[number];

/**
 * Canonical customers for UI / validation — hardcoded like {@link UserRole},
 * not read from the `{env}-smart-visits-Customers` Dynamo table.
 * Each row’s {@link CustomerRecord.locationId} references a {@link LocationRecord.locationId}.
 */
export const CUSTOMERS = [
  {
    customerId: "cust-acme",
    name: "Acme Corp",
    locationId: "loc-jacksonville-fl",
    arr: 250_000,
    status: "Live",
    isKeyAccount: true,
    updatedAt: "2026-04-01T10:00:00Z",
  },
  {
    customerId: "cust-techstart",
    name: "TechStart Inc",
    locationId: "loc-miami-fl",
    arr: 150_000,
    status: "Implementation",
    isKeyAccount: false,
    updatedAt: "2026-04-01T10:00:00Z",
  },
  {
    customerId: "cust-global-logistics",
    name: "Global Logistics",
    locationId: "loc-tampa-fl",
    arr: 500_000,
    status: "Live",
    isKeyAccount: true,
    updatedAt: "2026-04-01T10:00:00Z",
  },
  {
    customerId: "cust-retailmax",
    name: "RetailMax",
    locationId: "loc-orlando-fl",
    arr: 180_000,
    status: "Live",
    isKeyAccount: false,
    updatedAt: "2026-04-01T10:00:00Z",
  },
  {
    customerId: "cust-globex",
    name: "Globex Industries",
    locationId: "loc-atlanta-ga",
    arr: 320_000,
    status: "Prospect",
    isKeyAccount: false,
    updatedAt: "2026-04-01T10:00:00Z",
  },
] as const;

/** One row from {@link CUSTOMERS}. */
export type CustomerRecord = (typeof CUSTOMERS)[number];

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
