import { ThemeProvider, createTheme } from "@mui/material";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RWalk } from "./RWalk";

vi.mock("../three/WalkScene", () => ({ default: () => null }));
vi.mock("../charts/Plot", () => ({ Plot: () => null }));

async function playToEnd() {
    fireEvent.change(screen.getByLabelText("Steps value"), { target: { value: "10" } });
    await screen.findByText("0 / 10");
    fireEvent.change(screen.getByLabelText("Step size"), { target: { value: "100" } });
    await userEvent.click(screen.getByRole("button", { name: "Forward 100" }));
}

const TRACK_WIDTH = 100;
const TRACK = { width: TRACK_WIDTH, height: 10, top: 0, left: 0, right: TRACK_WIDTH, bottom: 10, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;

function dragTo(label: string, fraction: number) {
    const track = screen.getByLabelText(label).closest(".MuiSlider-root") as HTMLElement;
    track.getBoundingClientRect = () => TRACK;
    fireEvent.pointerDown(track, { clientX: 0, clientY: 0, buttons: 1 });
    fireEvent.pointerMove(document, { clientX: TRACK_WIDTH * fraction, clientY: 0, buttons: 1 });
}

function release(fraction: number) {
    fireEvent.pointerUp(document, { clientX: TRACK_WIDTH * fraction, clientY: 0 });
}

function renderWalk() {
    return render(<ThemeProvider theme={createTheme()}><RWalk /></ThemeProvider>);
}

describe("RWalk", () => {
    afterEach(() => vi.unstubAllGlobals());

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

    it("leaves the walk alone until a drag ends", async () => {
        renderWalk();
        await playToEnd();
        expect(screen.getByText("10 / 10")).toBeInTheDocument();
        dragTo("Walkers", 0.9);
        expect(screen.getByText("10 / 10")).toBeInTheDocument();
        release(0.9);
        expect(screen.getByText("0 / 10")).toBeInTheDocument();
    });

    it("follows the scrubber as it is dragged", async () => {
        renderWalk();
        await playToEnd();
        dragTo("Walk progress", 0.5);
        expect(screen.getByText("4 / 10")).toBeInTheDocument();
    });

    it("offers no statistics until the walk has played out", () => {
        renderWalk();
        expect(screen.getByRole("button", { name: "Statistics" })).toBeDisabled();
    });

    it("offers the statistics once the walk has played out", async () => {
        renderWalk();
        await playToEnd();
        expect(screen.getByRole("button", { name: "Statistics" })).toBeEnabled();
    });

    it("gives the whole page over to the statistics", async () => {
        renderWalk();
        await playToEnd();
        await userEvent.click(screen.getByRole("button", { name: "Statistics" }));
        await waitFor(() => expect(screen.getByLabelText("Samples")).toBeVisible());
        expect(screen.getByLabelText("Speed")).not.toBeVisible();
    });

    it("covers the wait with a spinner and nothing else", async () => {
        vi.stubGlobal("requestAnimationFrame", () => 1);
        renderWalk();
        await playToEnd();
        await userEvent.click(screen.getByRole("button", { name: "Statistics" }));
        expect(screen.getByRole("progressbar", { name: "Measuring the walkers" })).toBeInTheDocument();
        expect(screen.getByLabelText("Samples")).not.toBeVisible();
        expect(screen.getByLabelText("Back to the walk")).not.toBeVisible();
    });

    it("covers the wait again the next time the statistics are opened", async () => {
        renderWalk();
        await playToEnd();
        await userEvent.click(screen.getByRole("button", { name: "Statistics" }));
        await userEvent.click(await screen.findByRole("button", { name: "Back to the walk" }));
        vi.stubGlobal("requestAnimationFrame", () => 1);
        await userEvent.click(screen.getByRole("button", { name: "Statistics" }));
        expect(screen.getByRole("progressbar", { name: "Measuring the walkers" })).toBeInTheDocument();
    });

    it("comes back to the walk", async () => {
        renderWalk();
        await playToEnd();
        await userEvent.click(screen.getByRole("button", { name: "Statistics" }));
        await userEvent.click(await screen.findByRole("button", { name: "Back to the walk" }));
        await waitFor(() => expect(screen.queryByLabelText("Samples")).not.toBeInTheDocument());
        expect(screen.getByLabelText("Speed")).toBeVisible();
    });

    it("leaves the canvas behind in three dimensions", async () => {
        const { container } = renderWalk();
        await userEvent.click(screen.getByRole("button", { name: "3D" }));
        expect(container.querySelector("canvas")).not.toBeInTheDocument();
    });
});