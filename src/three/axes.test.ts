import { describe, expect, it } from "vitest";
import { edgeTicksFor, labelsFor, paneGridFor, ticksAlong } from "./axes";

const CUBE = { min: [-50, -50, -50], max: [50, 50, 50] };

function ticksInTotal(): number {
    return [0, 1, 2].reduce((total, axis) => total + ticksAlong(CUBE, axis, 5).length, 0);
}

describe("ticksAlong", () => {
    it("includes the origin", () => {
        expect(ticksAlong(CUBE, 0, 5)).toContain(0);
    });

    it("gives the same ticks on every axis of a cube", () => {
        expect(ticksAlong(CUBE, 0, 5)).toEqual(ticksAlong(CUBE, 2, 5));
    });
});

describe("edgeTicksFor", () => {
    it("draws a mark for every tick on every axis", () => {
        expect(edgeTicksFor(CUBE, 5, 4)).toHaveLength(ticksInTotal() * 6);
    });

    it("seats every mark on the surface of the box", () => {
        const marks = edgeTicksFor(CUBE, 5, 4);
        const inside = Array.from({ length: marks.length / 6 }, (_, mark) => [0, 1, 2]
            .some(axis => Math.abs(marks[mark * 6 + axis] ?? 0) === 50));
        expect(inside.every(Boolean)).toBe(true);
    });

    it("points every mark away from the box", () => {
        const marks = edgeTicksFor(CUBE, 5, 4);
        const outward = Array.from({ length: marks.length / 6 }, (_, mark) => [0, 1, 2]
            .some(axis => Math.abs(marks[mark * 6 + 3 + axis] ?? 0) > 50));
        expect(outward.every(Boolean)).toBe(true);
    });
});

describe("paneGridFor", () => {
    it("lays every line on one of the three far walls", () => {
        const grid = paneGridFor(CUBE, 5);
        const offWall = Array.from({ length: grid.length / 6 }, (_, line) => [0, 1, 2]
            .some(axis => (grid[line * 6 + axis] ?? 0) === -50 && (grid[line * 6 + 3 + axis] ?? 0) === -50));
        expect(offWall.every(Boolean)).toBe(true);
    });

    it("runs each line the full width of its wall", () => {
        const grid = paneGridFor(CUBE, 5);
        const spans = Array.from({ length: grid.length / 6 }, (_, line) => [0, 1, 2]
            .some(axis => Math.abs((grid[line * 6 + 3 + axis] ?? 0) - (grid[line * 6 + axis] ?? 0)) === 100));
        expect(spans.every(Boolean)).toBe(true);
    });

    it("draws a line for every tick on both directions of every wall", () => {
        const perWall = [0, 1, 2].reduce((total, axis) => total + ticksAlong(CUBE, axis, 5).length, 0);
        expect(paneGridFor(CUBE, 5)).toHaveLength(perWall * 2 * 6);
    });
});

describe("labelsFor", () => {
    it("gives one label per tick", () => {
        expect(labelsFor(CUBE, 5, 8)).toHaveLength(ticksInTotal());
    });

    it("labels the values, not the positions", () => {
        expect(labelsFor(CUBE, 5, 8).map(label => label.value)).toContain(0);
    });

    it("tells each label which way to sit clear of the box", () => {
        const outward = labelsFor(CUBE, 5, 8).every(label => label.out.filter(value => value !== 0).length === 1);
        expect(outward).toBe(true);
    });

    it("sits every label clear of the box", () => {
        const clear = labelsFor(CUBE, 5, 8).every(label => label.at.some(coord => Math.abs(coord) > 50));
        expect(clear).toBe(true);
    });
});
