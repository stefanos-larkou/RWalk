import { ThemeProvider, createTheme } from "@mui/material";
import { observers } from "@stefanos-larkou/sim-kit/testing";
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { boundsFor } from "../core/bounds";
import type { WalkOptions } from "../core/models";
import { walksFor } from "../core/walk";
import { contexts } from "../test-support";
import { WalkCanvas } from "./WalkCanvas";

const OPTIONS: WalkOptions = { dimensions: 2, steps: 20, diagonals: false };

function renderCanvas(upTo: number) {
    const tracks = walksFor(OPTIONS, 3, 1);
    const bounds = boundsFor(tracks).at(-1) ?? { min: [0, 0], max: [0, 0] };

    return render(
        <ThemeProvider theme={createTheme()}>
            <WalkCanvas tracks={tracks} bounds={bounds} span={20} upTo={upTo} />
        </ThemeProvider>
    );
}

describe("WalkCanvas", () => {
    it("puts a canvas on the page", () => {
        const { container } = renderCanvas(20);
        expect(container.querySelector("canvas")).toBeInTheDocument();
    });

    it("sizes the canvas to the space it is given", () => {
        const { container } = renderCanvas(20);
        act(() => observers[0]?.send({ width: 400, height: 300 }));
        expect(container.querySelector("canvas")).toHaveStyle({ width: "400px", height: "300px" });
    });

    it("draws the walks once it has been measured", () => {
        renderCanvas(20);
        act(() => observers[0]?.send({ width: 400, height: 300 }));
        expect(contexts.at(-1)?.named("clearRect").at(-1)?.args).toEqual([0, 0, 400, 300]);
    });

    it("numbers the axes", () => {
        renderCanvas(20);
        act(() => observers[0]?.send({ width: 400, height: 300 }));
        expect(contexts.at(-1)?.labels.length ?? 0).toBeGreaterThan(0);
    });

    it("draws the axes under the walk, not over it", () => {
        renderCanvas(20);
        act(() => observers[0]?.send({ width: 400, height: 300 }));
        const calls = contexts.at(-1)?.calls.map(call => call.name) ?? [];
        expect(calls.indexOf("clearRect")).toBeLessThan(calls.lastIndexOf("stroke"));
    });

    it("redraws when the playback moves", () => {
        const { rerender } = renderCanvas(5);
        act(() => observers[0]?.send({ width: 400, height: 300 }));
        const before = contexts.at(-1)?.named("lineTo").length ?? 0;
        const tracks = walksFor(OPTIONS, 3, 1);
        const bounds = boundsFor(tracks).at(-1) ?? { min: [0, 0], max: [0, 0] };
        rerender(
            <ThemeProvider theme={createTheme()}>
                <WalkCanvas tracks={tracks} bounds={bounds} span={20} upTo={15} />
            </ThemeProvider>
        );
        expect(contexts.at(-1)?.named("lineTo").length ?? 0).toBeGreaterThan(before);
    });
});
