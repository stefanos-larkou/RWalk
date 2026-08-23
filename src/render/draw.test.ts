import { describe, expect, it, vi } from "vitest";
import type { Track, ViewLayout } from "../core/models";
import { contexts, RecordingContext } from "../test-support";
import { clearCanvas, drawWalks, prepareCanvas } from "./draw";
import { INSET } from "./layout";
import { projectionFor } from "./projection";

const VIEW: ViewLayout = { scale: { x: 1, y: 1 }, origin: { x: 0, y: 0 }, content: { x: 100, y: 100 }, inset: INSET, canvas: { x: 400, y: 300 } };
const PROJECTION = projectionFor(1);
const TRACK: Track = { dimensions: 1, positions: Int32Array.from([0, 1, 0, 1, 2, 1]) };

function record() {
    return new RecordingContext();
}

function draw(context: RecordingContext, tracks: Track[], upTo: number, colours: string[] = ["red", "blue"]) {
    drawWalks(context.api, tracks, upTo, VIEW, PROJECTION, colours);
}

describe("clearCanvas", () => {
    it("clears the whole canvas", () => {
        const context = record();
        clearCanvas(context.api, VIEW);
        expect(context.named("clearRect")[0]?.args).toEqual([0, 0, 400, 300]);
    });
});

describe("drawWalks", () => {
    it("strokes each walker separately", () => {
        const one = record();
        const two = record();
        draw(one, [TRACK], 3);
        draw(two, [TRACK, TRACK], 3);
        expect(two.named("stroke").length - one.named("stroke").length).toBe(1);
    });

    it("gives each walker the colour it was handed", () => {
        const context = record();
        draw(context, [TRACK, TRACK], 3, ["red", "blue"]);
        expect(context.strokes).toEqual(["red", "blue"]);
    });

    it("starts each walker's path with a single move", () => {
        const one = record();
        const two = record();
        draw(one, [TRACK], 3);
        draw(two, [TRACK, TRACK], 3);
        expect(two.named("moveTo").length - one.named("moveTo").length).toBe(1);
    });

    it("draws only as far as it was told to", () => {
        const short = record();
        const long = record();
        draw(short, [TRACK], 2);
        draw(long, [TRACK], 5);
        expect(long.named("lineTo").length - short.named("lineTo").length).toBe(3);
    });

    it("draws nothing when there are no walkers", () => {
        const context = record();
        draw(context, [], 0);
        expect(context.named("stroke")).toEqual([]);
        expect(context.named("moveTo")).toEqual([]);
    });

    it("keeps a zoomed walk inside the plot area", () => {
        const context = record();
        draw(context, [TRACK], 3);
        const clipped = context.named("rect")[0]?.args ?? [];

        expect(context.calls.findIndex(call => call.name === "clip")).toBeLessThan(context.calls.findIndex(call => call.name === "stroke"));
        expect(clipped).toEqual([INSET.left, INSET.top, 400 - INSET.left - INSET.right, 300 - INSET.top - INSET.bottom]);
    });

    it("puts back whatever it changed", () => {
        const context = record();
        draw(context, [TRACK], 3);

        expect(context.named("save")).toHaveLength(context.named("restore").length);
    });
});

describe("prepareCanvas", () => {
    it("sizes the buffer by the pixel ratio and the element in CSS pixels", () => {
        vi.stubGlobal("devicePixelRatio", 2);
        const canvas = document.createElement("canvas");

        prepareCanvas(canvas, { x: 300, y: 200 });

        expect([canvas.width, canvas.height]).toEqual([600, 400]);
        expect([canvas.style.width, canvas.style.height]).toEqual(["300px", "200px"]);
        vi.unstubAllGlobals();
    });

    it("scales the drawing transform to match", () => {
        vi.stubGlobal("devicePixelRatio", 2);

        prepareCanvas(document.createElement("canvas"), { x: 300, y: 200 });

        expect(contexts.at(-1)?.transforms).toEqual([[2, 0, 0, 2, 0, 0]]);
        vi.unstubAllGlobals();
    });
});