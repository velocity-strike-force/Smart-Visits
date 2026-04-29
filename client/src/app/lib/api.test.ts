import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getVisits", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it("throws when VITE_API_BASE_URL is missing", async () => {
        vi.stubEnv("VITE_API_BASE_URL", "");
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        const { getVisits } = await import("./api");
        await expect(getVisits()).rejects.toThrow("Missing VITE_API_BASE_URL");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns visits from API payload", async () => {
        vi.stubEnv("VITE_API_BASE_URL", "https://example.test");
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                visits: [{ id: "v1", customer: "Acme" }],
            }),
        });
        vi.stubGlobal("fetch", fetchMock);

        const { getVisits } = await import("./api");
        await expect(getVisits()).resolves.toEqual([
            { id: "v1", customer: "Acme" },
        ]);
        expect(fetchMock).toHaveBeenCalledWith(
            "https://example.test/dev/visit",
        );
    });

    it("throws on non-ok responses", async () => {
        vi.stubEnv("VITE_API_BASE_URL", "https://example.test");
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({ ok: false, status: 500 }),
        );

        const { getVisits } = await import("./api");
        await expect(getVisits()).rejects.toThrow(
            "Failed to load visits (500)",
        );
    });
});
