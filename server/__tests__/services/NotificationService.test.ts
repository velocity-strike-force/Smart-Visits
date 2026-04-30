import { NotificationService } from "../../src/services/NotificationService";
import type { VisitData } from "../../src/database/schema/Visit";

function sampleVisit(overrides: Partial<VisitData> = {}): VisitData {
    return {
        visitId: "visit-100",
        productLine: "NetSuite",
        location: "Jacksonville, FL",
        city: "Jacksonville",
        state: "FL",
        salesRepId: "rep-001",
        salesRepName: "Jane Smith",
        domain: "ERP",
        customerId: "cust-001",
        customerName: "Acme Corp",
        customerARR: 250000,
        customerImplementationStatus: "Live",
        isKeyAccount: true,
        startDate: "2026-05-15",
        endDate: "2026-05-16",
        capacity: 5,
        invitees: [],
        customerContactRep: "John Doe",
        purposeForVisit: "Quarterly Review",
        visitDetails: "Meet in lobby at 9 AM.",
        isDraft: false,
        isPrivate: false,
        createdAt: "2026-04-01T10:00:00Z",
        updatedAt: "2026-04-01T10:00:00Z",
        ...overrides,
    };
}

describe("NotificationService", () => {
    const originalFrontendBaseUrl = process.env.FRONTEND_BASE_URL;

    beforeEach(() => {
        process.env.FRONTEND_BASE_URL = "http://localhost:5173";
    });

    afterAll(() => {
        process.env.FRONTEND_BASE_URL = originalFrontendBaseUrl;
    });

    it("sends individual email to each matched recipient", async () => {
        const recipients = [
            { userId: "user-002", name: "Alice", email: "alice@example.com" },
            { userId: "user-003", name: "Bob", email: "bob@example.com" },
        ];
        const preferenceMatcher = {
            findVisitRecipients: jest.fn().mockResolvedValue(recipients),
        };
        const outlookEmailService = {
            sendMail: jest.fn().mockResolvedValue(undefined),
        };

        const service = new NotificationService({
            preferenceMatcher: preferenceMatcher as any,
            outlookEmailService: outlookEmailService as any,
        });

        await service.notifyVisitCreated(sampleVisit());

        expect(outlookEmailService.sendMail).toHaveBeenCalledTimes(2);

        const firstCall = outlookEmailService.sendMail.mock.calls[0][0];
        expect(firstCall.to).toEqual([{ name: "Alice", email: "alice@example.com" }]);
        expect(firstCall.subject).toContain("Acme Corp");
        expect(firstCall.htmlBody).toContain("Alice");
        expect(firstCall.htmlBody).toContain("NetSuite");
        expect(firstCall.htmlBody).toContain("visit/visit-100");

        const secondCall = outlookEmailService.sendMail.mock.calls[1][0];
        expect(secondCall.to).toEqual([{ name: "Bob", email: "bob@example.com" }]);
    });

    it("does nothing when no recipients match", async () => {
        const preferenceMatcher = {
            findVisitRecipients: jest.fn().mockResolvedValue([]),
        };
        const outlookEmailService = {
            sendMail: jest.fn().mockResolvedValue(undefined),
        };

        const service = new NotificationService({
            preferenceMatcher: preferenceMatcher as any,
            outlookEmailService: outlookEmailService as any,
        });

        await service.notifyVisitCreated(sampleVisit());

        expect(outlookEmailService.sendMail).not.toHaveBeenCalled();
    });

    it("includes details URL and signup URL in email body", async () => {
        const preferenceMatcher = {
            findVisitRecipients: jest
                .fn()
                .mockResolvedValue([
                    { userId: "user-005", name: "Charlie", email: "charlie@example.com" },
                ]),
        };
        const outlookEmailService = {
            sendMail: jest.fn().mockResolvedValue(undefined),
        };

        const service = new NotificationService({
            preferenceMatcher: preferenceMatcher as any,
            outlookEmailService: outlookEmailService as any,
            frontendBaseUrl: "https://smart-visits.example.com",
        });

        await service.notifyVisitCreated(sampleVisit({ visitId: "visit-xyz" }));

        const payload = outlookEmailService.sendMail.mock.calls[0][0];
        expect(payload.htmlBody).toContain(
            "https://smart-visits.example.com/visit/visit-xyz"
        );
        expect(payload.htmlBody).toContain("action=signup");
    });

    it("renders email HTML with visit details (customer, location, dates)", async () => {
        const preferenceMatcher = {
            findVisitRecipients: jest
                .fn()
                .mockResolvedValue([
                    { userId: "user-006", name: "Dana", email: "dana@example.com" },
                ]),
        };
        const outlookEmailService = {
            sendMail: jest.fn().mockResolvedValue(undefined),
        };

        const service = new NotificationService({
            preferenceMatcher: preferenceMatcher as any,
            outlookEmailService: outlookEmailService as any,
        });

        const visit = sampleVisit({
            customerName: "Globex Industries",
            location: "Austin, TX",
            startDate: "2026-06-01",
            endDate: "2026-06-02",
        });

        await service.notifyVisitCreated(visit);

        const html = outlookEmailService.sendMail.mock.calls[0][0].htmlBody;
        expect(html).toContain("Globex Industries");
        expect(html).toContain("Austin, TX");
        expect(html).toContain("2026-06-01");
        expect(html).toContain("2026-06-02");
    });

    it("handles more than EMAIL_BATCH_SIZE recipients without error", async () => {
        const manyRecipients = Array.from({ length: 10 }, (_, i) => ({
            userId: `user-${i}`,
            name: `User ${i}`,
            email: `user${i}@example.com`,
        }));
        const preferenceMatcher = {
            findVisitRecipients: jest.fn().mockResolvedValue(manyRecipients),
        };
        const outlookEmailService = {
            sendMail: jest.fn().mockResolvedValue(undefined),
        };

        const service = new NotificationService({
            preferenceMatcher: preferenceMatcher as any,
            outlookEmailService: outlookEmailService as any,
        });

        await service.notifyVisitCreated(sampleVisit());

        expect(outlookEmailService.sendMail).toHaveBeenCalledTimes(10);
    });

    it("uses the visit subject format 'New visit available: {customerName}'", async () => {
        const preferenceMatcher = {
            findVisitRecipients: jest
                .fn()
                .mockResolvedValue([
                    { userId: "user-010", name: "Eve", email: "eve@example.com" },
                ]),
        };
        const outlookEmailService = {
            sendMail: jest.fn().mockResolvedValue(undefined),
        };

        const service = new NotificationService({
            preferenceMatcher: preferenceMatcher as any,
            outlookEmailService: outlookEmailService as any,
        });

        await service.notifyVisitCreated(
            sampleVisit({ customerName: "TechCo" })
        );

        expect(outlookEmailService.sendMail.mock.calls[0][0].subject).toBe(
            "New visit available: TechCo"
        );
    });
});
