import { Dynamo } from "../database/Dynamo";
import { VisitData } from "../database/schema/Visit";

export interface NotificationRecipient {
    userId: string;
    name: string;
    email: string;
}

function normalize(value: string): string {
    return value.trim().toLowerCase();
}

export class PreferenceMatcher {
    private readonly db: Dynamo;

    constructor(options?: { db?: Dynamo }) {
        this.db = options?.db ?? new Dynamo({});
    }

    async findVisitRecipients(visit: VisitData): Promise<NotificationRecipient[]> {
        const users = await this.db.getAllUsersWithEmailNotifications();
        const normalizedProductLine = normalize(visit.productLine);
        const normalizedCity = normalize(visit.city);
        const normalizedState = normalize(visit.state);
        const inviteeSet = new Set(visit.invitees.map((invitee) => normalize(invitee)));

        return users
            .filter((user) => user.userId !== visit.salesRepId)
            .filter((user) => user.email.trim().length > 0)
            .filter((user) => {
                if (!user.productLines.length) {
                    return false;
                }
                return user.productLines.some(
                    (productLine) => normalize(productLine) === normalizedProductLine
                );
            })
            .filter((user) => {
                if (!user.proximityAlerts) {
                    return true;
                }
                return (
                    normalize(user.city) === normalizedCity &&
                    normalize(user.state) === normalizedState
                );
            })
            .filter((user) => {
                if (!visit.isPrivate) {
                    return true;
                }
                const normalizedEmail = normalize(user.email);
                return (
                    inviteeSet.has(normalize(user.userId)) ||
                    inviteeSet.has(normalizedEmail)
                );
            })
            .map((user) => ({
                userId: user.userId,
                name: user.name || user.email,
                email: user.email,
            }));
    }
}

export default new PreferenceMatcher();
