const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export interface FetchWithRetryOptions {
    maxAttempts?: number;
    baseDelayMs?: number;
}

function isRetryableStatus(status: number): boolean {
    return RETRYABLE_STATUS_CODES.has(status);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
    request: () => Promise<Response>,
    context: string,
    options?: FetchWithRetryOptions
): Promise<Response> {
    const maxAttempts = options?.maxAttempts ?? 3;
    const baseDelayMs = options?.baseDelayMs ?? 300;

    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxAttempts) {
        attempt += 1;
        try {
            const response = await request();
            if (
                !response.ok &&
                isRetryableStatus(response.status) &&
                attempt < maxAttempts
            ) {
                const delayMs = baseDelayMs * 2 ** (attempt - 1);
                console.warn("Transient HTTP response, retrying request", {
                    context,
                    status: response.status,
                    attempt,
                    maxAttempts,
                    delayMs,
                });
                await sleep(delayMs);
                continue;
            }
            return response;
        } catch (error) {
            lastError = error;
            if (attempt >= maxAttempts) {
                break;
            }
            const delayMs = baseDelayMs * 2 ** (attempt - 1);
            console.warn("HTTP request threw error, retrying request", {
                context,
                attempt,
                maxAttempts,
                delayMs,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown request error",
            });
            await sleep(delayMs);
        }
    }

    throw new Error(
        `HTTP request failed after ${maxAttempts} attempts: ${context}. ${
            lastError instanceof Error ? lastError.message : "Unknown error"
        }`
    );
}
