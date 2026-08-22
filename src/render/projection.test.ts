import { createRandom } from "@stefanos-larkou/sim-kit";
import { describe, expect, it } from "vitest";
import { positionAt, walk } from "../core/walk";
import { projectionFor } from "./projection";

describe("projectionFor", () => {
    it("plots position against step in one dimension", () => {
        const track = walk({ dimensions: 1, steps: 50, diagonals: false }, createRandom(1));
        const projection = projectionFor(1);
        expect(projection.x(track, 20)).toBe(20);
        expect(projection.y(track, 20)).toBe(positionAt(track, 20)[0]);
    });

    it("plots the two lattice axes against each other in two dimensions", () => {
        const track = walk({ dimensions: 2, steps: 50, diagonals: false }, createRandom(1));
        const projection = projectionFor(2);
        const point = positionAt(track, 20);
        expect([projection.x(track, 20), projection.y(track, 20)]).toEqual(point);
    });
});