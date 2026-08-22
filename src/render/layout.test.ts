import { describe, expect, it } from "vitest";
import { layoutFor, toPixel, worldBox } from "./layout";

const AVAILABLE = { x: 800, y: 600 };

describe("worldBox", () => {
    it("puts step number on the x-axis in one dimension", () => {
        const box = worldBox({ min: [-3], max: [5] }, 200, 1);
        expect(box).toEqual({ minX: 0, maxX: 200, minY: -3, maxY: 5 });
    });

    it("puts both lattice axes on screen in two dimensions", () => {
        const box = worldBox({ min: [-3, -7], max: [5, 9] }, 200, 2);
        expect(box).toEqual({ minX: -3, maxX: 5, minY: -7, maxY: 9 });
    });
});

describe("layoutFor", () => {
    it("scales both axes alike when isotropic", () => {
        const view = layoutFor({ minX: 0, maxX: 10, minY: 0, maxY: 100 }, AVAILABLE, true);
        expect(view.scale.x).toBeCloseTo(view.scale.y);
    });

    it("fits each axis on its own when not isotropic", () => {
        const view = layoutFor({ minX: 0, maxX: 10, minY: 0, maxY: 100 }, AVAILABLE, false);
        expect(view.scale.x).toBeGreaterThan(view.scale.y);
    });

    it("centres a walk that has not moved yet", () => {
        const view = layoutFor({ minX: 0, maxX: 0, minY: 0, maxY: 0 }, AVAILABLE, true);
        const origin = toPixel(view, 0, 0);
        expect(origin.x).toBeCloseTo(AVAILABLE.x / 2);
        expect(origin.y).toBeCloseTo(AVAILABLE.y / 2);
    });

    it("centres an axis the walk has not moved along", () => {
        const view = layoutFor({ minX: 0, maxX: 100, minY: 0, maxY: 0 }, AVAILABLE, false);
        expect(toPixel(view, 0, 0).y).toBeCloseTo(AVAILABLE.y / 2);
    });

    it("survives a walk that never moves", () => {
        const view = layoutFor({ minX: 0, maxX: 0, minY: 0, maxY: 0 }, AVAILABLE, true);
        expect(Number.isFinite(view.scale.x)).toBe(true);
    });

    it("keeps the whole box on the canvas", () => {
        const box = { minX: -4, maxX: 6, minY: -2, maxY: 8 };
        const view = layoutFor(box, AVAILABLE, true);
        const corners = [toPixel(view, box.minX, box.minY), toPixel(view, box.maxX, box.maxY)];
        const escaped = corners.filter(point => point.x < 0 || point.y < 0 || point.x > AVAILABLE.x || point.y > AVAILABLE.y);
        expect(escaped).toEqual([]);
    });

    it("draws increasing values further up the screen", () => {
        const view = layoutFor({ minX: 0, maxX: 10, minY: 0, maxY: 10 }, AVAILABLE, true);
        expect(toPixel(view, 0, 10).y).toBeLessThan(toPixel(view, 0, 0).y);
    });
});