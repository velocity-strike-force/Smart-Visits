import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VisitsProvider, useVisits } from "./VisitsContext";

const getVisitsMock = vi.fn();

vi.mock("../lib/api", () => ({
    getVisits: (...args: unknown[]) => getVisitsMock(...args),
}));

function VisitsConsumer() {
    const { visits, addAttendee, removeAttendee, getVisit } = useVisits();
    const first = visits[0];

    return (
        <div>
            <div data-testid="visit-count">{visits.length}</div>
            <div data-testid="attendee-count">
                {first?.attendees.length ?? 0}
            </div>
            <div data-testid="visit-id">
                {getVisit(first?.id ?? "")?.id ?? ""}
            </div>
            <button
                onClick={() => first && addAttendee(first.id, "New Person")}
                type="button"
            >
                Add
            </button>
            <button
                onClick={() => first && removeAttendee(first.id, "New Person")}
                type="button"
            >
                Remove
            </button>
        </div>
    );
}

function renderWithProviders() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <Suspense fallback={<div>Loading</div>}>
                <VisitsProvider>
                    <VisitsConsumer />
                </VisitsProvider>
            </Suspense>
        </QueryClientProvider>,
    );
}

describe("VisitsContext", () => {
    beforeEach(() => {
        getVisitsMock.mockReset();
        getVisitsMock.mockResolvedValue([
            {
                id: "visit-1",
                customer: "Acme",
                date: "2026-04-29",
                productLine: "NetSuite",
                location: "Jacksonville, FL",
                capacity: 2,
                currentAttendees: 1,
            },
        ]);
    });

    it("maps API visits and supports attendee add/remove", async () => {
        const user = userEvent.setup();
        renderWithProviders();

        expect(await screen.findByTestId("visit-count")).toHaveTextContent("1");
        expect(screen.getByTestId("visit-id")).toHaveTextContent("visit-1");
        expect(screen.getByTestId("attendee-count")).toHaveTextContent("1");

        await user.click(screen.getByRole("button", { name: "Add" }));
        expect(screen.getByTestId("attendee-count")).toHaveTextContent("2");

        await user.click(screen.getByRole("button", { name: "Remove" }));
        expect(screen.getByTestId("attendee-count")).toHaveTextContent("1");
    });
});
