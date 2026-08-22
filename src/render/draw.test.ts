import { describe, expect, it, vi } from "vitest";
import type { Track, ViewLayout } from "../core/models";
import { contexts, RecordingContext } from "../test-support";
import { drawWalks, prepareCanvas } from "./draw";
import { projectionFor } from "./projection";

const VIEW: ViewLayout = { scale: { x: 1, y: 1 }, origin: { x: 0, y: 0 }, canvas: { x: 400, y: 300 } };
const PROJECTION = projectionFor(1);
const TRACK: Track = { dimensions: 1, positions: Int32Array.from([0, 1, 0, 1, 2, 1]) };

function record() {
    return new RecordingContext();
}

function draw(context: RecordingContext, tracks: Track[], upTo: number, colours: string[] = ["red", "blue"]) {
    drawWalks(context.api, tracks, upTo, VIEW, PROJECTION, colours, "grey");
}

describe("drawWalks", () => {
    it("clears before it draws anything", () => {
        const context = record();
        draw(context, [TRACK], 3);
        expect(context.calls[0]?.name).toBe("clearRect");
    });

    it("clears once however many walkers there are", () => {
        const context = record();
        draw(context, [TRACK, TRACK, TRACK], 3);
        expect(context.named("clearRect")).toHaveLength(1);
    });

    it("clears the whole canvas", () => {
        const context = record();
        draw(context, [TRACK], 3);
        expect(context.named("clearRect")[0]?.args).toEqual([0, 0, 400, 300]);
    });

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
        expect(context.strokes).toEqual(["grey", "red", "blue"]);
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

    it("marks the origin even with no walkers", () => {
        const context = record();
        draw(context, [], 0);
        expect(context.named("stroke")).toHaveLength(1);
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