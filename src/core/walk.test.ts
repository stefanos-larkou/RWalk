import { createRandom } from "@stefanos-larkou/sim-kit";
import { describe, expect, it } from "vitest";
import type { WalkOptions } from "./models";
import { positionAt, stepsIn, walk, walksFor } from "./walk";

const OPTIONS: WalkOptions = { dimensions: 3, steps: 200, diagonals: false };

describe("walk", () => {
    it("records one position per step plus the start", () => {
        expect(stepsIn(walk(OPTIONS, createRandom(1)))).toBe(200);
    });

    it("starts at the origin", () => {
        expect(positionAt(walk(OPTIONS, createRandom(1)), 0)).toEqual([0, 0, 0]);
    });

    it("moves along exactly one axis each step without diagonals", () => {
        const track = walk(OPTIONS, createRandom(3));
        const moves = Array.from({ length: 200 }, (_, step) => {
            const before = positionAt(track, step);
            const after = positionAt(track, step + 1);
            return after.filter((value, axis) => value !== before[axis]).length;
        });
        expect(new Set(moves)).toEqual(new Set([1]));
    });

    it("repeats exactly for the same seed", () => {
        const first = walk(OPTIONS, createRandom(9));
        const second = walk(OPTIONS, createRandom(9));
        expect(first.positions).toEqual(second.positions);
    });
});

describe("walksFor", () => {
    it("does not send every walker the same way", () => {
        const tracks = walksFor(OPTIONS, 20, 42);
        const first = new Set(tracks.map(track => positionAt(track, 1).join(",")));
        expect(first.size).toBeGreaterThan(1);
    });

    it("gives no two walkers the same track", () => {
        const tracks = walksFor(OPTIONS, 10, 42);
        const distinct = new Set(tracks.map(track => track.positions.join(",")));
        expect(distinct.size).toBe(10);
    });
});
