import { ThemeProvider, createTheme } from "@mui/material";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RWalk } from "./RWalk";

vi.mock("../three/WalkScene", () => ({ default: () => null }));

function renderWalk() {
    return render(<ThemeProvider theme={createTheme()}><RWalk /></ThemeProvider>);
}

describe("RWalk", () => {
    it("offers the three dimensions", () => {
        renderWalk();
        expect(screen.getByRole("button", { name: "1D" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "3D" })).toBeInTheDocument();
    });

    it("disables diagonal moves in one dimension", async () => {
        renderWalk();
        await userEvent.click(screen.getByRole("button", { name: "1D" }));
        expect(screen.getByRole("switch", { name: "Diagonal moves" })).toBeDisabled();
    });

    it("offers diagonal moves above one dimension", async () => {
        renderWalk();
        await userEvent.click(screen.getByRole("button", { name: "3D" }));
        expect(screen.getByRole("switch", { name: "Diagonal moves" })).toBeEnabled();
    });

    it("shows diagonal moves as off in one dimension however it was left", async () => {
        renderWalk();
        await userEvent.click(screen.getByRole("switch", { name: "Diagonal moves" }));
        await userEvent.click(screen.getByRole("button", { name: "1D" }));
        expect(screen.getByRole("switch", { name: "Diagonal moves" })).not.toBeChecked();
    });

    it("remembers the dimensions between visits", async () => {
        const { unmount } = renderWalk();
        await userEvent.click(screen.getByRole("button", { name: "3D" }));
        unmount();
        renderWalk();
        expect(screen.getByRole("button", { name: "3D" })).toHaveAttribute("aria-pressed", "true");
    });

    it("draws the walk", () => {
        const { container } = renderWalk();
        expect(container.querySelector("canvas")).toBeInTheDocument();
    });

    it("starts with nothing drawn", () => {
        renderWalk();
        expect(screen.getByText("0 / 1000")).toBeInTheDocument();
    });

    it("reveals the starting point before it counts a step", async () => {
        renderWalk();
        await userEvent.click(screen.getByRole("button", { name: "Forward 1" }));
        expect(screen.getByText("0 / 1000")).toBeInTheDocument();
    });

    it("counts the steps as the walk is stepped through", async () => {
        renderWalk();
        const forward = screen.getByRole("button", { name: "Forward 1" });
        await userEvent.click(forward);
        await userEvent.click(forward);
        await userEvent.click(forward);
        expect(screen.getByText("2 / 1000")).toBeInTheDocument();
    });

    it("names the step buttons after the step size", async () => {
        renderWalk();
        fireEvent.change(screen.getByLabelText("Step size"), { target: { value: "25" } });
        expect(screen.getByRole("button", { name: "Forward 25" })).toBeInTheDocument();
    });

    it("offers to play and then to pause", async () => {
        renderWalk();
        await userEvent.click(screen.getByRole("button", { name: "Play" }));
        expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    });

    it("returns to the start when replayed", async () => {
        renderWalk();
        await userEvent.click(screen.getByRole("button", { name: "Forward 1" }));
        await userEvent.click(screen.getByRole("button", { name: "Start again" }));
        expect(screen.getByText("0 / 1000")).toBeInTheDocument();
    });

    it("returns to the start when the walk changes", async () => {
        renderWalk();
        const forward = screen.getByRole("button", { name: "Forward 1" });
        await userEvent.click(forward);
        await userEvent.click(forward);
        await userEvent.click(forward);
        fireEvent.change(screen.getByLabelText("Seed value"), { target: { value: "99" } });
        expect(screen.getByText("0 / 1000")).toBeInTheDocument();
    });

    it("keeps its place when only the view changes", async () => {
        renderWalk();
        const forward = screen.getByRole("button", { name: "Forward 1" });
        await userEvent.click(forward);
        await userEvent.click(forward);
        await userEvent.click(forward);

        await userEvent.click(screen.getByRole("switch", { name: "Stable limits" }));

        expect(screen.getByText("2 / 1000")).toBeInTheDocument();
    });

    it("leaves the canvas behind in three dimensions", async () => {
        const { container } = renderWalk();
        await userEvent.click(screen.getByRole("button", { name: "3D" }));
        expect(container.querySelector("canvas")).not.toBeInTheDocument();
    });
});