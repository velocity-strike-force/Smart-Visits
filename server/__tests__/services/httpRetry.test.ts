import { fetchWithRetry } from "../../src/services/httpRetry";

describe("fetchWithRetry", () => {
    beforeEach(() => {
        jest.restoreAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("returns response on first successful attempt", async () => {
        const mockResponse = new Response("OK", { status: 200 });
        const request = jest.fn().mockResolvedValue(mockResponse);

        const promise = fetchWithRetry(request, "test:success");
        jest.runAllTimers();
        const result = await promise;

        expect(result.status).toBe(200);
        expect(request).toHaveBeenCalledTimes(1);
    });

    it("returns non-retryable error response immediately without retrying", async () => {
        const mockResponse = new Response("Not Found", { status: 404 });
        const request = jest.fn().mockResolvedValue(mockResponse);

        const promise = fetchWithRetry(request, "test:not-found");
        jest.runAllTimers();
        const result = await promise;

        expect(result.status).toBe(404);
        expect(request).toHaveBeenCalledTimes(1);
    });

    it("retries on 429 (rate-limited) and succeeds on second attempt", async () => {
        const rateLimitedResponse = new Response("Too Many Requests", { status: 429 });
        const successResponse = new Response("OK", { status: 200 });
        const request = jest
            .fn()
            .mockResolvedValueOnce(rateLimitedResponse)
            .mockResolvedValueOnce(successResponse);

        const promise = fetchWithRetry(request, "test:retry-429", {
            baseDelayMs: 100,
        });
        await jest.advanceTimersByTimeAsync(100);
        const result = await promise;

        expect(result.status).toBe(200);
        expect(request).toHaveBeenCalledTimes(2);
    });

    it("retries on 500 (server error) up to maxAttempts", async () => {
        const serverError = new Response("Internal Server Error", { status: 500 });
        const request = jest.fn().mockResolvedValue(serverError);

        const promise = fetchWithRetry(request, "test:retry-500", {
            maxAttempts: 3,
            baseDelayMs: 50,
        });

        await jest.advanceTimersByTimeAsync(50);
        await jest.advanceTimersByTimeAsync(100);
        const result = await promise;

        expect(result.status).toBe(500);
        expect(request).toHaveBeenCalledTimes(3);
    });

    it("retries on 502, 503, 504 status codes", async () => {
        const codes = [502, 503, 504];

        for (const code of codes) {
            jest.restoreAllMocks();
            const errorResponse = new Response("Error", { status: code });
            const successResponse = new Response("OK", { status: 200 });
            const request = jest
                .fn()
                .mockResolvedValueOnce(errorResponse)
                .mockResolvedValueOnce(successResponse);

            const promise = fetchWithRetry(request, `test:retry-${code}`, {
                baseDelayMs: 10,
            });
            await jest.advanceTimersByTimeAsync(10);
            const result = await promise;

            expect(result.status).toBe(200);
            expect(request).toHaveBeenCalledTimes(2);
        }
    });

    it("retries on network/fetch error and succeeds on retry", async () => {
        const successResponse = new Response("OK", { status: 200 });
        const request = jest
            .fn()
            .mockRejectedValueOnce(new Error("ECONNRESET"))
            .mockResolvedValueOnce(successResponse);

        const promise = fetchWithRetry(request, "test:network-error", {
            baseDelayMs: 50,
        });
        await jest.advanceTimersByTimeAsync(50);
        const result = await promise;

        expect(result.status).toBe(200);
        expect(request).toHaveBeenCalledTimes(2);
    });

    it("throws after all retry attempts are exhausted on network error", async () => {
        jest.useRealTimers();
        const request = jest.fn().mockRejectedValue(new Error("ETIMEDOUT"));

        await expect(
            fetchWithRetry(request, "test:all-fail", {
                maxAttempts: 2,
                baseDelayMs: 10,
            })
        ).rejects.toThrow(
            /HTTP request failed after 2 attempts.*test:all-fail.*ETIMEDOUT/
        );
        expect(request).toHaveBeenCalledTimes(2);
        jest.useFakeTimers();
    });

    it("applies exponential backoff between retries", async () => {
        const serverError = new Response("Error", { status: 503 });
        const successResponse = new Response("OK", { status: 200 });
        const request = jest
            .fn()
            .mockResolvedValueOnce(serverError)
            .mockResolvedValueOnce(serverError)
            .mockResolvedValueOnce(successResponse);

        const promise = fetchWithRetry(request, "test:backoff", {
            maxAttempts: 4,
            baseDelayMs: 100,
        });

        // First retry after 100ms (100 * 2^0)
        await jest.advanceTimersByTimeAsync(100);
        expect(request).toHaveBeenCalledTimes(2);

        // Second retry after 200ms (100 * 2^1)
        await jest.advanceTimersByTimeAsync(200);
        const result = await promise;

        expect(result.status).toBe(200);
        expect(request).toHaveBeenCalledTimes(3);
    });

    it("does not retry 408 on the final attempt", async () => {
        const timeoutResponse = new Response("Timeout", { status: 408 });
        const request = jest.fn().mockResolvedValue(timeoutResponse);

        const promise = fetchWithRetry(request, "test:timeout", {
            maxAttempts: 1,
            baseDelayMs: 50,
        });
        jest.runAllTimers();
        const result = await promise;

        expect(result.status).toBe(408);
        expect(request).toHaveBeenCalledTimes(1);
    });

    it("does not retry 400 or 401 (non-retryable client errors)", async () => {
        for (const code of [400, 401, 403]) {
            jest.restoreAllMocks();
            const response = new Response("Error", { status: code });
            const request = jest.fn().mockResolvedValue(response);

            const promise = fetchWithRetry(request, `test:no-retry-${code}`, {
                maxAttempts: 3,
                baseDelayMs: 10,
            });
            jest.runAllTimers();
            const result = await promise;

            expect(result.status).toBe(code);
            expect(request).toHaveBeenCalledTimes(1);
        }
    });
});
