import { describe, expect, it } from "vitest";
import type { Box, ViewLayout } from "../core/models";
import { RecordingContext } from "../test-support";
import { drawAxes } from "./axes";
import { INSET } from "./layout";

const VIEW: ViewLayout = { scale: { x: 2, y: 2 }, origin: { x: 200, y: 200 }, content: { x: 100, y: 100 }, inset: INSET, canvas: { x: 400, y: 300 } };
const PALETTE = { grid: "grid", axis: "axis" };

function draw(box: Box) {
    const context = new RecordingContext();
    drawAxes(context.api, VIEW, box, PALETTE);
    return context;
}

describe("drawAxes", () => {
    it("labels every rule it draws", () => {
        const context = draw({ minX: -40, maxX: 40, minY: -40, maxY: 40 });
        expect(context.labels).toHaveLength(context.named("stroke").length);
    });

    it("writes the tick values, not pixel positions", () => {
        const context = draw({ minX: -40, maxX: 40, minY: -40, maxY: 40 });
        expect(context.labels.map(label => label.text)).toContain("0");
    });

    it("draws the axis itself in the axis colour and the rest as grid", () => {
        const context = draw({ minX: -40, maxX: 40, minY: -40, maxY: 40 });
        expect(context.strokes.filter(colour => colour === "axis")).toHaveLength(2);
        expect(context.strokes.filter(colour => colour === "grid").length).toBeGreaterThan(0);
    });

    it("draws no axis line when the walk never spans zero", () => {
        const context = draw({ minX: 100, maxX: 200, minY: 100, maxY: 200 });
        expect(context.strokes).not.toContain("axis");
    });

    it("has something to show for a walk that has not moved", () => {
        const context = draw({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
        expect(context.labels.length).toBeGreaterThan(0);
    });
});