import { createRandom } from "@stefanos-larkou/sim-kit";
import { describe, expect, it } from "vitest";
import { walk } from "../core/walk";
import { boxEdgesFor, centreOf, cubeAround, radiusOf, verticesFor } from "./geometry";

const TRACK = walk({ dimensions: 3, steps: 50, diagonals: false }, createRandom(1));
const BOX = { min: [-1, -2, -3], max: [1, 2, 3] };

describe("verticesFor", () => {
    it("gives three numbers per revealed step", () => {
        expect(verticesFor(TRACK, 10)).toHaveLength(33);
    });

    it("gives nothing before the walk has started", () => {
        expect(verticesFor(TRACK, -1)).toHaveLength(0);
    });

    it("starts at the origin", () => {
        expect(Array.from(verticesFor(TRACK, 0))).toEqual([0, 0, 0]);
    });

    it("moves by one unit between consecutive points", () => {
        const vertices = verticesFor(TRACK, 50);
        const jumps = Array.from({ length: 50 }, (_, step) => Math.hypot(
            (vertices[step * 3 + 3] ?? 0) - (vertices[step * 3] ?? 0),
            (vertices[step * 3 + 4] ?? 0) - (vertices[step * 3 + 1] ?? 0),
            (vertices[step * 3 + 5] ?? 0) - (vertices[step * 3 + 2] ?? 0)
        ));
        expect(jumps.every(jump => Math.abs(jump - 1) < 1e-6)).toBe(true);
    });
});

describe("boxEdgesFor", () => {
    it("draws twelve edges", () => {
        expect(boxEdgesFor(BOX)).toHaveLength(72);
    });

    it("visits every corner of the box", () => {
        const points = new Set<string>();
        const edges = boxEdgesFor(BOX);
        for (let index = 0; index < edges.length; index += 3) {
            points.add(`${edges[index]},${edges[index + 1]},${edges[index + 2]}`);
        }
        expect(points.size).toBe(8);
    });
});

describe("centreOf", () => {
    it("is the middle of the box", () => {
        expect(centreOf(BOX)).toEqual([0, 0, 0]);
    });
});

describe("cubeAround", () => {
    it("has three sides of the same length", () => {
        const cube = cubeAround({ min: [-1, -2, -3], max: [1, 2, 3] });
        const spans = [0, 1, 2].map(axis => (cube.max[axis] ?? 0) - (cube.min[axis] ?? 0));
        expect(new Set(spans).size).toBe(1);
    });

    it("holds the whole walk", () => {
        const box = { min: [-1, -2, -3], max: [4, 2, 3] };
        const cube = cubeAround(box);
        const escaped = [0, 1, 2].filter(axis => (cube.min[axis] ?? 0) > (box.min[axis] ?? 0) || (cube.max[axis] ?? 0) < (box.max[axis] ?? 0));
        expect(escaped).toEqual([]);
    });

    it("shares its centre with the walk", () => {
        expect(centreOf(cubeAround({ min: [-1, -2, -3], max: [4, 2, 3] }))).toEqual(centreOf({ min: [-1, -2, -3], max: [4, 2, 3] }));
    });

    it("never collapses for a walk that never moved", () => {
        const cube = cubeAround({ min: [0, 0, 0], max: [0, 0, 0] });
        expect((cube.max[0] ?? 0) - (cube.min[0] ?? 0)).toBeGreaterThan(0);
    });
});

describe("radiusOf", () => {
    it("encloses the whole box", () => {
        expect(radiusOf(BOX)).toBeCloseTo(Math.hypot(2, 4, 6) / 2);
    });

    it("never collapses for a walk that never moved", () => {
        expect(radiusOf({ min: [0, 0, 0], max: [0, 0, 0] })).toBeGreaterThan(0);
    });
});