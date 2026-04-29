import { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayLambdaHandler } from "./ApiGatewayLambdaHandler";
import { Dynamo } from "../database/Dynamo";
import type { Customer } from "../database/schema/Customer";
import type { Domain } from "../database/schema/Domain";
import type { ProductLine } from "../database/schema/ProductLine";
import type { Role } from "../database/schema/Role";
import type {
    ReferenceCustomerDto,
    ReferenceDataPayload,
    ReferenceDomainDto,
    ReferenceProductLineDto,
    ReferenceRoleDto,
} from "../database/schema/referenceData";

export class ReferenceDataHandler extends ApiGatewayLambdaHandler {
    private readonly db: Dynamo;

    constructor(options?: { db?: Dynamo }) {
        super();
        this.db = options?.db ?? new Dynamo({});
    }

    async handleReferenceDataEndpoint(
        event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        return this.handleEndpoint(event, {
            GET: this.getReferenceData.bind(this),
        });
    }

    private async getReferenceData(
        _event: APIGatewayProxyEventV2
    ): Promise<APIGatewayProxyResult> {
        try {
            const [customers, roles, productLines, domains] = await Promise.all([
                this.db.getAllCustomers(),
                this.db.getAllRoles(),
                this.db.getAllProductLines(),
                this.db.getAllDomains(),
            ]);

            const payload: ReferenceDataPayload = {
                customers: customers
                    .map((c) => this.customerToDto(c))
                    .sort((a, b) =>
                        a.customerName.localeCompare(b.customerName, undefined, {
                            sensitivity: "base",
                        })
                    ),
                roles: roles
                    .map((r) => this.roleToDto(r))
                    .sort((a, b) => a.sortOrder - b.sortOrder),
                productLines: productLines
                    .map((p) => this.productLineToDto(p))
                    .sort((a, b) => a.sortOrder - b.sortOrder),
                domains: domains
                    .map((d) => this.domainToDto(d))
                    .sort((a, b) => a.sortOrder - b.sortOrder),
            };

            return this.createSuccessResponse({
                success: true,
                ...payload,
            });
        } catch (err) {
            return this.createErrorResponse(500, {
                success: false,
                message:
                    err instanceof Error
                        ? err.message
                        : "Failed to load reference data",
            });
        }
    }

    private customerToDto(c: Customer): ReferenceCustomerDto {
        return {
            customerId: c.customerId,
            customerName: c.customerName,
            ...(c.arr !== undefined ? { arr: c.arr } : {}),
            ...(c.implementationStatus !== undefined
                ? { implementationStatus: c.implementationStatus }
                : {}),
            ...(c.isKeyAccount !== undefined
                ? { isKeyAccount: c.isKeyAccount }
                : {}),
            ...(c.domain !== undefined ? { domain: c.domain } : {}),
            ...(c.primaryContactName !== undefined
                ? { primaryContactName: c.primaryContactName }
                : {}),
            ...(c.primaryContactEmail !== undefined
                ? { primaryContactEmail: c.primaryContactEmail }
                : {}),
            ...(c.updatedAt !== undefined
                ? { updatedAt: c.updatedAt.toISOString() }
                : {}),
        };
    }

    private roleToDto(r: Role): ReferenceRoleDto {
        return {
            roleId: r.roleId,
            name: r.name,
            description: r.description,
            sortOrder: r.sortOrder,
            createdAt: r.createdAt.toISOString(),
        };
    }

    private productLineToDto(p: ProductLine): ReferenceProductLineDto {
        return {
            productLineId: p.productLineId,
            name: p.name,
            description: p.description,
            sortOrder: p.sortOrder,
            isActive: p.isActive,
            createdAt: p.createdAt.toISOString(),
        };
    }

    private domainToDto(d: Domain): ReferenceDomainDto {
        return {
            domainId: d.domainId,
            name: d.name,
            description: d.description,
            sortOrder: d.sortOrder,
            createdAt: d.createdAt.toISOString(),
        };
    }
}
