import { describe, expect, it } from "vitest";
import { boundsFor } from "./bounds";
import type { WalkOptions } from "./models";
import { positionAt, walksFor } from "./walk";

const OPTIONS: WalkOptions = { dimensions: 2, steps: 100, diagonals: false };

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