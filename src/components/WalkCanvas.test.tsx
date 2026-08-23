import { ThemeProvider, createTheme } from "@mui/material";
import { observers } from "@stefanos-larkou/sim-kit/testing";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { boundsFor } from "../core/bounds";
import type { WalkOptions } from "../core/models";
import { walksFor } from "../core/walk";
import { contexts } from "../test-support";
import { WalkCanvas } from "./WalkCanvas";

const OPTIONS: WalkOptions = { dimensions: 2, steps: 20, diagonals: false };

function walkCanvas(upTo: number, stableLimits = true, tracks = walksFor(OPTIONS, 3, 1)) {
    const bounds = boundsFor(tracks).at(-1) ?? { min: [0, 0], max: [0, 0] };

    return (
        <ThemeProvider theme={createTheme()}>
            <WalkCanvas tracks={tracks} bounds={bounds} span={20} upTo={upTo} stableLimits={stableLimits} />
        </ThemeProvider>
    );
}

function renderCanvas(upTo: number) {
    return render(walkCanvas(upTo));
}

function lastDrawn(): number[] {
    const calls = contexts.at(-1)?.calls ?? [];
    const cleared = calls.map(call => call.name).lastIndexOf("clearRect");

    return calls.slice(cleared).filter(call => call.name === "lineTo").map(call => call.args[0] ?? 0);
}

function widthDrawn(): number {
    const across = lastDrawn();
    return Math.max(...across) - Math.min(...across);
}

function leftmostDrawn(): number {
    return Math.min(...lastDrawn());
}

function furthestLabelled(): number {
    const context = contexts.at(-1);
    const names = context?.calls.map(call => call.name) ?? [];
    const earlier = names.slice(0, names.lastIndexOf("clearRect")).filter(name => name === "fillText").length;
    const drawn = (context?.labels ?? []).slice(earlier);

    return Math.max(...drawn.map(label => Math.abs(Number(label.text))));
}

function area(container: HTMLElement): HTMLElement {
    return container.querySelector("canvas")?.parentElement as HTMLElement;
}

function wheel(container: HTMLElement, deltaY: number) {
    act(() => {
        fireEvent.wheel(area(container), { deltaY });
    });
}

function pan(container: HTMLElement, by: number) {
    act(() => {
        fireEvent.pointerDown(area(container), { clientX: 100, clientY: 100 });
        fireEvent.pointerMove(area(container), { clientX: 100 + by, clientY: 100 });
        fireEvent.pointerUp(area(container), { clientX: 100 + by, clientY: 100 });
    });
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

    it("spreads the walk further out on a wheel towards the screen", () => {
        const { container } = renderCanvas(20);
        act(() => observers[0]?.send({ width: 400, height: 300 }));
        const before = widthDrawn();

        wheel(container, -300);

        expect(widthDrawn()).toBeGreaterThan(before);
    });

    it("opens as far out as it goes", () => {
        const { container } = renderCanvas(20);
        act(() => observers[0]?.send({ width: 400, height: 300 }));
        const before = widthDrawn();

        wheel(container, 300);

        expect(widthDrawn()).toBeCloseTo(before);
    });

    it("has nowhere to pan a walk that is wholly on screen", () => {
        const { container } = renderCanvas(20);
        act(() => observers[0]?.send({ width: 400, height: 300 }));
        const before = leftmostDrawn();

        pan(container, 40);

        expect(leftmostDrawn()).toBeCloseTo(before);
    });

    it("pans a walk it has been zoomed into", () => {
        const { container } = renderCanvas(20);
        act(() => observers[0]?.send({ width: 400, height: 300 }));
        wheel(container, -600);
        const before = leftmostDrawn();

        pan(container, 40);

        expect(leftmostDrawn()).toBeCloseTo(before + 40);
    });

    it("numbers the axes for what is on screen, not for the whole walk", () => {
        const { container } = renderCanvas(20);
        act(() => observers[0]?.send({ width: 400, height: 300 }));
        const before = furthestLabelled();

        wheel(container, -600);

        expect(furthestLabelled()).toBeLessThan(before);
    });

    it("opens a walk it has not seen before as far out as it goes", () => {
        const { container, rerender } = renderCanvas(20);
        act(() => observers[0]?.send({ width: 400, height: 300 }));
        const fitted = widthDrawn();

        wheel(container, -600);
        rerender(walkCanvas(20));

        expect(widthDrawn()).toBeCloseTo(fitted);
    });

    it("opens fully out again when the walk is framed differently", () => {
        const tracks = walksFor(OPTIONS, 3, 1);
        const { container, rerender } = render(walkCanvas(20, true, tracks));
        act(() => observers[0]?.send({ width: 400, height: 300 }));
        const fitted = widthDrawn();

        wheel(container, -600);
        rerender(walkCanvas(20, false, tracks));

        expect(widthDrawn()).toBeCloseTo(fitted);
    });

    it("redraws when the playback moves", () => {
        const { rerender } = renderCanvas(5);
        act(() => observers[0]?.send({ width: 400, height: 300 }));
        const before = contexts.at(-1)?.named("lineTo").length ?? 0;
        rerender(walkCanvas(15));
        expect(contexts.at(-1)?.named("lineTo").length ?? 0).toBeGreaterThan(before);
    });
});
