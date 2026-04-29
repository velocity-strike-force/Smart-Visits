import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Visit } from "./VisitsContext";
import Dashboard from "./Dashboard";

const useUserMock = vi.fn();
const useVisitsMock = vi.fn();

vi.mock("./UserContext", () => ({
    useUser: () => useUserMock(),
}));

vi.mock("./VisitsContext", () => ({
    useVisits: () => useVisitsMock(),
}));

function makeVisit(overrides: Partial<Visit>): Visit {
    return {
        id: "visit-1",
        title: "Visit",
        customer: "Customer",
        date: new Date(),
        productLine: "NetSuite",
        location: "Jacksonville, FL",
        arr: 1000,
        salesRep: "Rep",
        domain: "Manufacturing",
        capacity: 5,
        attendees: ["A"],
        creatorEmail: "rep@example.com",
        ...overrides,
    };
}

describe("Dashboard", () => {
    beforeEach(() => {
        useVisitsMock.mockReturnValue({
            visits: [
                makeVisit({
                    id: "active",
                    customer: "Active Co",
                    isDraft: false,
                }),
                makeVisit({ id: "draft", customer: "Draft Co", isDraft: true }),
            ],
        });
    });

    it("hides draft visits for visitor role", () => {
        useUserMock.mockReturnValue({
            user: { role: "visitor" },
        });

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>,
        );

        expect(screen.getByText("Active Co")).toBeInTheDocument();
        expect(screen.queryByText("Draft Co")).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Post a Visit" }),
        ).not.toBeInTheDocument();
    });

    it("shows sales rep actions and list status", async () => {
        const user = userEvent.setup();
        useUserMock.mockReturnValue({
            user: { role: "sales_rep" },
        });

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole("button", { name: "Post a Visit" }),
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "List" }));

        expect(screen.getByText("Draft Co")).toBeInTheDocument();
        expect(screen.getAllByText("Draft").length).toBeGreaterThan(0);
    });
});
