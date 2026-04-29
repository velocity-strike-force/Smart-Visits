import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Visit } from "./VisitsContext";
import Feedback from "./Feedback";

const useUserMock = vi.fn();
const useVisitsMock = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("./UserContext", () => ({
    useUser: () => useUserMock(),
}));

vi.mock("./VisitsContext", () => ({
    useVisits: () => useVisitsMock(),
}));

vi.mock("sonner", () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccess(...args),
        error: (...args: unknown[]) => toastError(...args),
    },
}));

function makeVisit(overrides: Partial<Visit>): Visit {
    return {
        id: "visit-1",
        title: "Quarterly Review",
        customer: "Acme Corp",
        date: new Date("2026-04-01T12:00:00.000Z"),
        productLine: "NetSuite",
        location: "Jacksonville, FL",
        arr: 1000,
        salesRep: "Jane Smith",
        domain: "Manufacturing",
        capacity: 5,
        attendees: ["Visitor User"],
        creatorEmail: "jane@example.com",
        ...overrides,
    };
}

describe("Feedback", () => {
    beforeEach(() => {
        toastSuccess.mockReset();
        toastError.mockReset();
    });

    it("shows validation error when submitting without notes", async () => {
        const visit = makeVisit({ id: "past-visit" });
        const user = userEvent.setup();

        useUserMock.mockReturnValue({
            user: {
                role: "visitor",
                name: "Visitor User",
                email: "visitor@example.com",
            },
        });
        useVisitsMock.mockReturnValue({
            visits: [visit],
            getVisit: (id: string) => (id === visit.id ? visit : undefined),
        });

        render(
            <MemoryRouter initialEntries={[`/feedback/${visit.id}`]}>
                <Routes>
                    <Route path="/feedback/:id" element={<Feedback />} />
                </Routes>
            </MemoryRouter>,
        );

        await user.click(
            screen.getByRole("button", { name: "Submit Feedback" }),
        );

        expect(toastError).toHaveBeenCalledWith(
            "Please provide feedback notes",
        );
        expect(toastSuccess).not.toHaveBeenCalled();
    });

    it("submits and navigates when visit is past and notes are provided", async () => {
        const visit = makeVisit({ id: "past-visit-2" });
        const user = userEvent.setup();

        useUserMock.mockReturnValue({
            user: {
                role: "sales_rep",
                name: "Jane Smith",
                email: "jane@example.com",
            },
        });
        useVisitsMock.mockReturnValue({
            visits: [visit],
            getVisit: (id: string) => (id === visit.id ? visit : undefined),
        });

        render(
            <MemoryRouter initialEntries={[`/feedback/${visit.id}`]}>
                <Routes>
                    <Route path="/feedback/:id" element={<Feedback />} />
                    <Route path="/" element={<div>Dashboard</div>} />
                </Routes>
            </MemoryRouter>,
        );

        await user.type(
            screen.getByPlaceholderText("Enter your feedback notes..."),
            "Strong customer engagement and clear next steps.",
        );
        await user.click(
            screen.getByRole("button", { name: "Submit Feedback" }),
        );

        expect(toastSuccess).toHaveBeenCalledWith(
            "Feedback submitted successfully!",
        );
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
});
