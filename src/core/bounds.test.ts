import { describe, expect, it } from "vitest";
import { anchoredAtOrigin, boundsFor } from "./bounds";
import type { WalkOptions } from "./models";
import { positionAt, walksFor } from "./walk";

const OPTIONS: WalkOptions = { dimensions: 2, steps: 100, diagonals: false };

describe("anchoredAtOrigin", () => {
    it("puts the origin at the centre of every axis", () => {
        const anchored = anchoredAtOrigin({ min: [-3, -1], max: [5, 9] });
        const centres = anchored.min.map((value, axis) => (value + (anchored.max[axis] ?? 0)) / 2);
        expect(centres).toEqual([0, 0]);
    });

    it("still holds everything the walk reached", () => {
        const box = { min: [-3, -1], max: [5, 9] };
        const anchored = anchoredAtOrigin(box);
        const escaped = box.min.filter((value, axis) => value < (anchored.min[axis] ?? 0) || (box.max[axis] ?? 0) > (anchored.max[axis] ?? 0));
        expect(escaped).toEqual([]);
    });

    it("keeps each axis as tight as it can be", () => {
        expect(anchoredAtOrigin({ min: [-3, -1], max: [5, 9] })).toEqual({ min: [-5, -9], max: [5, 9] });
    });

    it("has nothing to widen for a walk that never moved", () => {
        const anchored = anchoredAtOrigin({ min: [0, 0], max: [0, 0] });
        expect(anchored.min.every(value => value === 0)).toBe(true);
        expect(anchored.max.every(value => value === 0)).toBe(true);
    });
});

describe("boundsFor", () => {
    it("has nothing to report for no walkers", () => {
        expect(boundsFor([])).toEqual([]);
    });

    it("starts at the origin", () => {
        const [start] = boundsFor(walksFor(OPTIONS, 5, 1));
        expect(start).toEqual({ min: [0, 0], max: [0, 0] });
    });

    it("never shrinks as the walk goes on", () => {
        const bounds = boundsFor(walksFor(OPTIONS, 5, 1));
        const shrunk = bounds.filter((box, step) => {
            const before = bounds[step - 1];
            return before !== undefined && box.min.some((value, axis) => value > (before.min[axis] ?? 0));
        });
        expect(shrunk).toEqual([]);
    });

    it("contains every position of every walker at the end", () => {
        const tracks = walksFor(OPTIONS, 5, 1);
        const last = boundsFor(tracks).at(-1);
        const escaped = tracks.flatMap(track => Array.from({ length: 101 }, (_, step) => positionAt(track, step))
            .filter(point => point.some((value, axis) => value < (last?.min[axis] ?? 0) || value > (last?.max[axis] ?? 0))));
        expect(escaped).toEqual([]);
    });

    it("grows by at most one step per axis", () => {
        const bounds = boundsFor(walksFor(OPTIONS, 5, 1));
        const jumped = bounds.filter((box, step) => {
            const before = bounds[step - 1];
            return before !== undefined && box.max.some((value, axis) => value - (before.max[axis] ?? 0) > 1);
        });
        expect(jumped).toEqual([]);
    });
});