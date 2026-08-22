import { createRandom } from "@stefanos-larkou/sim-kit";
import { describe, expect, it } from "vitest";
import { squaredDistanceAt } from "./displacement";
import type { WalkOptions } from "./models";
import { positionAt, walk } from "./walk";

const OPTIONS: WalkOptions = { dimensions: 3, steps: 400, diagonals: false };

describe("squaredDistanceAt", () => {
    it("is nothing at the start", () => {
        expect(squaredDistanceAt(walk(OPTIONS, createRandom(1)), 0)).toBe(0);
    });

    it("is the sum of the squared components", () => {
        const track = walk(OPTIONS, createRandom(2));
        const expected = positionAt(track, 400).reduce((total, value) => total + value * value, 0);
        expect(squaredDistanceAt(track, 400)).toBe(expected);
    });

    it("shares its parity with the step count when each step moves one axis", () => {
        const track = walk(OPTIONS, createRandom(3));
        const wrong = Array.from({ length: 401 }, (_, step) => squaredDistanceAt(track, step) % 2 === step % 2);
        expect(wrong.every(Boolean)).toBe(true);
    });

    it("never exceeds the square of the step count", () => {
        const track = walk(OPTIONS, createRandom(4));
        const beyond = Array.from({ length: 401 }, (_, step) => squaredDistanceAt(track, step) > step * step);
        expect(beyond.some(Boolean)).toBe(false);
    });
});