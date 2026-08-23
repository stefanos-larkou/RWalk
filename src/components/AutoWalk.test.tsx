import { ThemeProvider, createTheme } from "@mui/material";
import { observers } from "@stefanos-larkou/sim-kit/testing";
import { act, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { contexts } from "../test-support";
import { AutoWalk } from "./AutoWalk";

vi.mock("../three/WalkScene", () => ({ default: () => null }));

const BRISK = 100000;

function renderWalk(props: Partial<Parameters<typeof AutoWalk>[0]> = {}) {
    const drawn = render(
        <ThemeProvider theme={createTheme()}>
            <AutoWalk seed={1} dimensions={2} walkers={3} steps={20} speed={BRISK} {...props} />
        </ThemeProvider>
    );
    act(() => observers[0]?.send({ width: 400, height: 300 }));
    return drawn;
}

describe("AutoWalk", () => {
    it("draws a walk without being asked to", () => {
        const { container } = renderWalk();
        expect(container.querySelector("canvas")).toBeInTheDocument();
    });

    it("numbers nothing, being decoration rather than a chart", () => {
        renderWalk();
        expect(contexts.at(-1)?.labels).toEqual([]);
    });

    it("gives the whole canvas over to the walk", () => {
        renderWalk();
        const clipped = contexts.at(-1)?.named("rect").at(-1)?.args;
        expect(clipped).toEqual([0, 0, 400, 300]);
    });

    it("says when the walk has played out", async () => {
        const onFinished = vi.fn();
        renderWalk({ onFinished });
        await waitFor(() => expect(onFinished).toHaveBeenCalled());
    });

    it("says so once and not on every frame after", async () => {
        const onFinished = vi.fn();
        renderWalk({ onFinished });
        await waitFor(() => expect(onFinished).toHaveBeenCalled());
        await new Promise(settle => setTimeout(settle, 60));
        expect(onFinished).toHaveBeenCalledTimes(1);
    });

    it("leaves the canvas behind in three dimensions", () => {
        const { container } = renderWalk({ dimensions: 3 });
        expect(container.querySelector("canvas")).not.toBeInTheDocument();
    });
});
