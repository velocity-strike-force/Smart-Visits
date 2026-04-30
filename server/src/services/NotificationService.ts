import { VisitData } from "../database/schema/Visit";
import {
    EmailRecipient,
    OutlookEmailService,
    OutlookEmailPayload,
} from "./OutlookEmailService";
import {
    NotificationRecipient,
    PreferenceMatcher,
} from "./PreferenceMatcher";
import { renderVisitCreatedEmail } from "../templates/visitCreatedEmail";

const EMAIL_BATCH_SIZE = 4;

function chunk<T>(items: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += chunkSize) {
        chunks.push(items.slice(index, index + chunkSize));
    }
    return chunks;
}

export class NotificationService {
    private readonly preferenceMatcher: PreferenceMatcher;
    private readonly outlookEmailService: OutlookEmailService;
    private readonly frontendBaseUrl: string;

    constructor(options?: {
        preferenceMatcher?: PreferenceMatcher;
        outlookEmailService?: OutlookEmailService;
        frontendBaseUrl?: string;
    }) {
        this.preferenceMatcher =
            options?.preferenceMatcher ?? new PreferenceMatcher();
        this.outlookEmailService =
            options?.outlookEmailService ?? new OutlookEmailService();
        this.frontendBaseUrl =
            options?.frontendBaseUrl ??
            process.env.FRONTEND_BASE_URL ??
            "https://smart-visits.example.com";
    }

    async notifyVisitCreated(visit: VisitData): Promise<void> {
        const recipients = await this.preferenceMatcher.findVisitRecipients(visit);
        if (recipients.length === 0) {
            console.info("No recipients matched for visit notification", {
                visitId: visit.visitId,
            });
            return;
        }

        const detailsUrl = this.buildDetailsUrl(visit.visitId);
        const signupUrl = this.buildSignupUrl(visit.visitId);
        const subject = `New visit available: ${visit.customerName}`;

        const batches = chunk(recipients, EMAIL_BATCH_SIZE);
        let emailsSent = 0;

        for (const batch of batches) {
            for (const recipient of batch) {
                const htmlBody = renderVisitCreatedEmail({
                    recipientName: recipient.name,
                    visit,
                    detailsUrl,
                    signupUrl,
                });
                const payload: OutlookEmailPayload = {
                    to: [this.toEmailRecipient(recipient)],
                    subject,
                    htmlBody,
                };
                await this.outlookEmailService.sendMail(payload);
                emailsSent += 1;
            }
        }

        console.info("Visit notification emails dispatched", {
            visitId: visit.visitId,
            recipientsMatched: recipients.length,
            emailsSent,
        });
    }

    private buildDetailsUrl(visitId: string): string {
        const baseUrl = this.frontendBaseUrl.replace(/\/+$/, "");
        return `${baseUrl}/visit/${encodeURIComponent(visitId)}`;
    }

    private buildSignupUrl(visitId: string): string {
        const baseUrl = this.frontendBaseUrl.replace(/\/+$/, "");
        return `${baseUrl}/visit/${encodeURIComponent(visitId)}?action=signup`;
    }

    private toEmailRecipient(recipient: NotificationRecipient): EmailRecipient {
        return {
            name: recipient.name,
            email: recipient.email,
        };
    }
}

export default new NotificationService();
