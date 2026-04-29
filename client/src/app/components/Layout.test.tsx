import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RouteLoadingFallback } from "./Layout";

describe("RouteLoadingFallback", () => {
    it("renders form fallback for post visit route", () => {
        render(<RouteLoadingFallback pathname="/post-visit" role="visitor" />);
        expect(screen.getByTestId("fallback-form")).toBeInTheDocument();
        expect(screen.getByTestId("fallback-role-action").className).toContain(
            "w-32",
        );
    });

    it("renders list fallback for feedback route", () => {
        render(<RouteLoadingFallback pathname="/feedback" role="sales_rep" />);
        expect(screen.getByTestId("fallback-list")).toBeInTheDocument();
        expect(screen.getByTestId("fallback-role-action").className).toContain(
            "w-40",
        );
    });

    it("renders calendar fallback for dashboard route", () => {
        render(<RouteLoadingFallback pathname="/" role="sales_rep" />);
        expect(screen.getByTestId("fallback-calendar")).toBeInTheDocument();
        expect(screen.getByTestId("fallback-role-action").className).toContain(
            "w-28",
        );
    });
});
