import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PostVisit from "./PostVisit";

const toastSuccess = vi.fn();

vi.mock("sonner", () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccess(...args),
        error: vi.fn(),
    },
}));

vi.mock("../lib/api", () => ({
    createVisit: vi.fn().mockResolvedValue({ success: true, visitId: "v-test" }),
}));

describe("PostVisit", () => {
    beforeEach(() => {
        toastSuccess.mockReset();
    });

    it("shows success toast when saving draft", async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter initialEntries={["/post-visit"]}>
                <Routes>
                    <Route path="/post-visit" element={<PostVisit />} />
                    <Route path="/" element={<div>Dashboard</div>} />
                </Routes>
            </MemoryRouter>,
        );

        await user.click(screen.getByRole("button", { name: "Save as Draft" }));

        expect(toastSuccess).toHaveBeenCalledWith("Visit saved as draft");
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("includes notification channels in post success message", async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter initialEntries={["/post-visit"]}>
                <Routes>
                    <Route path="/post-visit" element={<PostVisit />} />
                    <Route path="/" element={<div>Dashboard</div>} />
                </Routes>
            </MemoryRouter>,
        );

        await user.type(
            screen.getByPlaceholderText(/Search product line/i),
            "NetSuite",
        );
        await user.type(
            screen.getByPlaceholderText("e.g., Jacksonville, FL"),
            "Jacksonville, FL",
        );
        await user.type(
            screen.getByPlaceholderText(/Search domain/i),
            "Manufacturing",
        );
        await user.type(
            screen.getByPlaceholderText("Search for customer"),
            "Acme Corp",
        );
        await user.type(screen.getByPlaceholderText("e.g., 10"), "5");
        await user.type(
            screen.getByPlaceholderText("Contact person at customer site"),
            "Alex Smith",
        );
        await user.type(screen.getByPlaceholderText(/Search purpose/i), "QBR");
        await user.type(
            screen.getByPlaceholderText(
                "e.g., Closed-toed shoes required, parking information, etc.",
            ),
            "Detailed visit notes for logistics.",
        );

        await user.click(screen.getByRole("button", { name: "Post Visit" }));

        expect(toastSuccess).toHaveBeenCalledWith(
            "Visit posted successfully! Notifications sent via email.",
        );
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
});
