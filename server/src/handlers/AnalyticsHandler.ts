import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";

export class AnalyticsHandler extends ApiGatewayLambdaHandler {
    private readonly db: Dynamo;

    constructor() {
        super();
        this.db = new Dynamo({});
    }

    async handleAnalyticsEndpoint(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        return this.handleEndpoint(event, {
            GET: this.getAnalytics.bind(this),
        });
    }

    private async getAnalytics(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        try {
            const reportType = event.queryStringParameters?.report ?? "summary";
            const visits = await this.db.getAllVisits();

            const customerStats = new Map<
                string,
                { visitCount: number; lastVisitDate: Date }
            >();
            const salesRepStats = new Map<string, number>();

            for (const visit of visits) {
                const customerName = visit.customerName || "Unknown";
                const existingCustomerStats = customerStats.get(customerName);
                if (existingCustomerStats) {
                    existingCustomerStats.visitCount += 1;
                    if (visit.startDate > existingCustomerStats.lastVisitDate) {
                        existingCustomerStats.lastVisitDate = visit.startDate;
                    }
                } else {
                    customerStats.set(customerName, {
                        visitCount: 1,
                        lastVisitDate: visit.startDate,
                    });
                }

                const salesRepName = visit.salesRepName || "Unknown";
                salesRepStats.set(
                    salesRepName,
                    (salesRepStats.get(salesRepName) ?? 0) + 1
                );
            }

            const topCustomersByVisitCount = [...customerStats.entries()]
                .sort((a, b) => b[1].visitCount - a[1].visitCount)
                .slice(0, 5)
                .map(([customerName, stats]) => ({
                    customerName,
                    visitCount: stats.visitCount,
                }));

            const topSalesRepsByVisitCount = [...salesRepStats.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([salesRepName, visitCount]) => ({
                    salesRepName,
                    visitCount,
                }));

            const leastVisitedCustomers = [...customerStats.entries()]
                .sort((a, b) => {
                    if (a[1].visitCount === b[1].visitCount) {
                        return (
                            a[1].lastVisitDate.getTime() -
                            b[1].lastVisitDate.getTime()
                        );
                    }
                    return a[1].visitCount - b[1].visitCount;
                })
                .slice(0, 5)
                .map(([customerName, stats]) => ({
                    customerName,
                    lastVisitDate: stats.lastVisitDate.toISOString().slice(0, 10),
                    visitCount: stats.visitCount,
                }));

            const now = new Date();
            const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
            const quarterStart = new Date(
                now.getFullYear(),
                quarterStartMonth,
                1
            );

            const totalVisitsThisQuarter = visits.filter(
                (visit) => visit.startDate >= quarterStart && visit.startDate <= now
            ).length;

            return this.createSuccessResponse({
                success: true,
                report: reportType,
                data: {
                    topCustomersByVisitCount,
                    topSalesRepsByVisitCount,
                    totalVisits: visits.length,
                    totalVisitsThisQuarter,
                    leastVisitedCustomers,
                },
            });
        } catch (error) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            });
        }
    }
}
