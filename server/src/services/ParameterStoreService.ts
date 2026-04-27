import { SSMClient, GetParametersByPathCommand } from "@aws-sdk/client-ssm";

export class ParameterStoreService {
    private static instance: ParameterStoreService;
    private params: Record<string, string> = {};
    private initialized = false;
    private readonly ssmClient: SSMClient;
    private readonly basePath: string;

    private constructor() {
        this.ssmClient = new SSMClient({});
        this.basePath = `/smart-visits/${process.env.STAGE || "dev"}/`;
    }

    static getInstance(): ParameterStoreService {
        if (!ParameterStoreService.instance) {
            ParameterStoreService.instance = new ParameterStoreService();
        }
        return ParameterStoreService.instance;
    }

    async init(): Promise<void> {
        if (this.initialized) return;

        let nextToken: string | undefined;
        do {
            const command = new GetParametersByPathCommand({
                Path: this.basePath,
                WithDecryption: true,
                NextToken: nextToken,
            });
            const result = await this.ssmClient.send(command);
            for (const param of result.Parameters ?? []) {
                if (param.Name && param.Value) {
                    const key = param.Name.replace(this.basePath, "");
                    this.params[key] = param.Value;
                }
            }
            nextToken = result.NextToken;
        } while (nextToken);

        this.initialized = true;
    }

    get(key: string): string | undefined {
        return this.params[key];
    }

    getRequired(key: string): string {
        const value = this.params[key];
        if (!value) {
            throw new Error(
                `Required parameter not found: ${this.basePath}${key}`
            );
        }
        return value;
    }
}
