import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Visit } from "./VisitsContext";
import VisitDetail from "./VisitDetail";

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

vi.mock("./VisitorSignUpCard", () => ({
    default: ({ onSignUp }: { onSignUp: () => void }) => (
        <button onClick={onSignUp} type="button">
            Visitor Card Sign Up
        </button>
    ),
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
        title: "Review",
        customer: "Acme",
        date: new Date("2026-04-01T12:00:00.000Z"),
        productLine: "NetSuite",
        location: "Jacksonville, FL",
        arr: 1000,
        salesRep: "Jane Smith",
        domain: "Manufacturing",
        capacity: 5,
        attendees: [],
        creatorEmail: "jane@example.com",
        ...overrides,
    };
}

describe("VisitDetail", () => {
    beforeEach(() => {
        toastSuccess.mockReset();
        toastError.mockReset();
    });

    it("allows visitor signup and triggers addAttendee", async () => {
        const visit = makeVisit({
            id: "visit-signup",
            attendees: ["Other Person"],
        });
        const addAttendee = vi.fn();
        const removeAttendee = vi.fn();
        const user = userEvent.setup();

        useUserMock.mockReturnValue({
            user: {
                role: "visitor",
                name: "Visitor User",
                email: "visitor@example.com",
            },
        });
        useVisitsMock.mockReturnValue({
            getVisit: (id: string) => (id === visit.id ? visit : undefined),
            addAttendee,
            removeAttendee,
        });

        render(
            <MemoryRouter initialEntries={[`/visit/${visit.id}`]}>
                <Routes>
                    <Route path="/visit/:id" element={<VisitDetail />} />
                </Routes>
            </MemoryRouter>,
        );

        await user.click(
            screen.getByRole("button", { name: "Visitor Card Sign Up" }),
        );

        expect(addAttendee).toHaveBeenCalledWith(visit.id, "Visitor User");
        expect(toastSuccess).toHaveBeenCalledWith(
            "Successfully signed up for visit!",
        );
        expect(removeAttendee).not.toHaveBeenCalled();
    });

    it("blocks attendee removal for non-managing users", async () => {
        const visit = makeVisit({
            id: "visit-no-manage",
            attendees: ["Alex Doe"],
            creatorEmail: "different-owner@example.com",
        });
        const addAttendee = vi.fn();
        const removeAttendee = vi.fn();
        const user = userEvent.setup();

        useUserMock.mockReturnValue({
            user: {
                role: "sales_rep",
                name: "Rep User",
                email: "rep@example.com",
            },
        });
        useVisitsMock.mockReturnValue({
            getVisit: (id: string) => (id === visit.id ? visit : undefined),
            addAttendee,
            removeAttendee,
        });

        render(
            <MemoryRouter initialEntries={[`/visit/${visit.id}`]}>
                <Routes>
                    <Route path="/visit/:id" element={<VisitDetail />} />
                </Routes>
            </MemoryRouter>,
        );

        expect(
            screen.queryByRole("button", { name: "Remove" }),
        ).not.toBeInTheDocument();

        expect(toastError).not.toHaveBeenCalled();
        expect(addAttendee).not.toHaveBeenCalled();
        expect(removeAttendee).not.toHaveBeenCalled();
    });
});
