/**
 * Inserts 10 test rows into each Smart Visits DynamoDB table.
 *
 * Usage (from server/):
 *   STAGE=dev npx ts-node --transpile-only scripts/seed-test-records.ts
 *
 * Optional (DynamoDB Local):
 *   STAGE=dev DYNAMODB_ENDPOINT=http://localhost:8000 npx ts-node --transpile-only scripts/seed-test-records.ts
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { smartVisitsTables } from "../src/database/schema";
import type { VisitData } from "../src/database/models/Visit";
import type { UserData } from "../src/database/models/User";
import type { SignupData } from "../src/database/models/Signup";
import type { FeedbackData } from "../src/database/models/Feedback";
import type { CustomerData } from "../src/database/models/Customer";
import type { AuditLogData } from "../src/database/models/AuditLog";

const STAGE = process.env.STAGE || "dev";
const COUNT = 10;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function iso(d: Date): string {
  return d.toISOString();
}

async function main(): Promise<void> {
  const tables = smartVisitsTables(STAGE);
  const dynamo = new DynamoDBClient({
    ...(process.env.DYNAMODB_ENDPOINT && {
      endpoint: process.env.DYNAMODB_ENDPOINT,
    }),
  });
  const doc = DynamoDBDocumentClient.from(dynamo, {
    marshallOptions: { removeUndefinedValues: true },
  });

  const now = new Date();
  const base = iso(now);

  const customers: CustomerData[] = [];
  const users: UserData[] = [];
  const visits: VisitData[] = [];
  const signups: SignupData[] = [];
  const feedback: FeedbackData[] = [];
  const audits: AuditLogData[] = [];

  for (let i = 0; i < COUNT; i++) {
    const p = pad(i);
    customers.push({
      customerId: `cust-seed-${p}`,
      customerName: `Seed Customer ${i}`,
      arr: 150_000 + i * 25_000,
      implementationStatus: i % 2 === 0 ? "Active" : "Implementation",
      isKeyAccount: i % 4 === 0,
      domain: ["Manufacturing", "Retail", "Logistics"][i % 3],
      primaryContactName: `Contact ${i}`,
      primaryContactEmail: `contact${i}@seed.example.com`,
    });

    users.push({
      userId: `user-seed-${p}`,
      name: `Seed User ${i}`,
      email: `user${i}.seed@example.com`,
      productLines: ["NetSuite", "Oracle Cloud"].slice(0, (i % 2) + 1),
      city: "Jacksonville",
      state: "FL",
      emailNotifications: true,
      slackNotifications: i % 2 === 0,
      proximityAlerts: false,
      proximityDistanceMiles: 25 + i,
      createdAt: base,
      updatedAt: base,
    });

    const start = new Date(Date.UTC(2026, 4, 5 + i, 14, 0, 0, 0));
    const end = new Date(Date.UTC(2026, 4, 5 + i, 18, 0, 0, 0));
    visits.push({
      visitId: `visit-seed-${p}`,
      productLine: ["NetSuite", "Oracle Cloud", "Shipping"][i % 3],
      location: "Jacksonville, FL",
      city: "Jacksonville",
      state: "FL",
      salesRepId: `user-seed-${pad(i % 3)}`,
      salesRepName: `Seed Rep ${i % 3}`,
      domain: ["Manufacturing", "Technology", "Healthcare"][i % 3],
      customerId: `cust-seed-${p}`,
      customerName: `Seed Customer ${i}`,
      customerARR: 200_000 + i * 10_000,
      customerImplementationStatus: "Active",
      isKeyAccount: i % 3 === 0,
      startDate: iso(start),
      endDate: iso(end),
      capacity: 8 + (i % 5),
      invitees: [`invitee${i}a@example.com`, `invitee${i}b@example.com`],
      customerContactRep: `rep${i}@customer.example.com`,
      purposeForVisit: ["Quarterly Review", "Training", "Demo"][i % 3],
      visitDetails: `Test visit seed record ${i}.`,
      isDraft: i === COUNT - 1,
      isPrivate: i % 5 === 0,
      createdAt: base,
      updatedAt: base,
    });

    signups.push({
      visitId: `visit-seed-${p}`,
      userId: `user-seed-${p}`,
      userName: `Seed User ${i}`,
      userEmail: `user${i}.seed@example.com`,
      signedUpAt: iso(new Date(Date.UTC(2026, 4, 4 + i, 9, 30, 0, 0))),
    });

    feedback.push({
      visitId: `visit-seed-${p}`,
      userId: `user-seed-${p}`,
      userName: `Seed User ${i}`,
      role: i % 2 === 0 ? "salesRep" : "visitor",
      feedbackNotes: `Seed feedback notes for visit ${i}. Strong engagement.`,
      keyAreasOfFocus: ["Expansion", "Support tickets", "Roadmap"],
      detractors: i % 3 === 0 ? "Timeline slip on one item" : "None noted",
      delighters: "Team collaboration",
      submittedAt: iso(new Date(Date.UTC(2026, 4, 6 + i, 16, 0, 0, 0))),
    });

    audits.push({
      entityId: `visit-seed-${p}`,
      timestamp: iso(new Date(Date.UTC(2026, 4, 1, 10 + i, 0, 0, i * 17))),
      action: ["CREATE", "UPDATE", "DELETE"][i % 3] as AuditLogData["action"],
      entityType: "Visit",
      userId: `user-seed-${pad(i % 3)}`,
      userName: `Seed User ${i % 3}`,
      before: i % 3 === 1 ? { status: "draft" } : null,
      after: { visitId: `visit-seed-${p}`, note: `seed audit ${i}` },
    });
  }

  async function putAll<T extends Record<string, unknown>>(
    label: string,
    tableName: string,
    items: T[]
  ): Promise<void> {
    for (const item of items) {
      await doc.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        })
      );
    }
    console.log(`${label}: wrote ${items.length} items → ${tableName}`);
  }

  await putAll("Customers", tables.customers, customers);
  await putAll("Users", tables.users, users);
  await putAll("Visits", tables.visits, visits);
  await putAll("Signups", tables.signups, signups);
  await putAll("Feedback", tables.feedback, feedback);
  await putAll("AuditLog", tables.auditLog, audits);

  console.log(`Done. STAGE=${STAGE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
