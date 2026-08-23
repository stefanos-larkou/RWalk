import { describe, expect, it } from "vitest";
import { INSET, MAX_ZOOM, MIN_ZOOM, NO_INSET, clampPan, layoutFor, panLimitFor, toPixel, usableFrom, visibleBox, worldBox, zoomed } from "./layout";

const AVAILABLE = { x: 800, y: 600 };
const WHOLE = { x: 400, y: 400 };
const BOX = { minX: -10, maxX: 10, minY: -10, maxY: 10 };
const NOWHERE = { x: 0, y: 0 };
const MIDDLE = {
    x: INSET.left + (AVAILABLE.x - INSET.left - INSET.right) / 2,
    y: INSET.top + (AVAILABLE.y - INSET.top - INSET.bottom) / 2
};

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
        expect(origin.x).toBeCloseTo(MIDDLE.x);
        expect(origin.y).toBeCloseTo(MIDDLE.y);
    });

    it("centres an axis the walk has not moved along", () => {
        const view = layoutFor({ minX: 0, maxX: 100, minY: 0, maxY: 0 }, AVAILABLE, false);
        expect(toPixel(view, 0, 0).y).toBeCloseTo(MIDDLE.y);
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

describe("a view with no inset", () => {
    it("gives the whole canvas over to the walk", () => {
        const bare = layoutFor(BOX, WHOLE, true, NO_INSET);
        expect(bare.content.x).toBeCloseTo(WHOLE.x);
        expect(bare.content.y).toBeCloseTo(WHOLE.y);
    });

    it("centres the walk on the canvas rather than on a plot area within it", () => {
        const bare = layoutFor(BOX, WHOLE, true, NO_INSET);
        const middle = toPixel(bare, 0, 0);
        expect(middle.x).toBeCloseTo(WHOLE.x / 2);
        expect(middle.y).toBeCloseTo(WHOLE.y / 2);
    });

    it("shows exactly the walk and no margin around it", () => {
        const shown = visibleBox(layoutFor(BOX, WHOLE, true, NO_INSET));
        expect([shown.minX, shown.maxX]).toEqual([BOX.minX, BOX.maxX]);
    });

    it("keeps the bordered view smaller than the bare one", () => {
        const bordered = layoutFor(BOX, WHOLE, true);
        expect(bordered.content.x).toBeLessThan(layoutFor(BOX, WHOLE, true, NO_INSET).content.x);
    });
});

describe("zoomed", () => {
    it("leaves the fitted view alone", () => {
        const fitted = layoutFor(BOX, AVAILABLE, true);
        expect(zoomed(fitted, MIN_ZOOM, NOWHERE)).toEqual(fitted);
    });

    it("holds the middle of the plot area still", () => {
        const fitted = layoutFor(BOX, AVAILABLE, true);
        const usable = usableFrom(AVAILABLE, INSET);
        const middle = { x: INSET.left + usable.x / 2, y: INSET.top + usable.y / 2 };
        const before = toPixel(fitted, 0, 0);
        const after = toPixel(zoomed(fitted, 4, NOWHERE), 0, 0);

        expect(after.x - middle.x).toBeCloseTo((before.x - middle.x) * 4);
        expect(after.y - middle.y).toBeCloseTo((before.y - middle.y) * 4);
    });

    it("spreads the walk over more pixels the further it is zoomed in", () => {
        const fitted = layoutFor(BOX, AVAILABLE, true);
        const close = zoomed(fitted, 3, NOWHERE);

        expect(close.scale.x).toBeCloseTo(fitted.scale.x * 3);
        expect(close.content.x).toBeCloseTo(fitted.content.x * 3);
    });

    it("moves the walk by exactly what it is panned", () => {
        const fitted = layoutFor(BOX, AVAILABLE, true);
        const before = toPixel(zoomed(fitted, 2, NOWHERE), 0, 0);
        const after = toPixel(zoomed(fitted, 2, { x: 30, y: -20 }), 0, 0);

        expect([after.x - before.x, after.y - before.y]).toEqual([30, -20]);
    });
});

describe("panLimitFor", () => {
    it("allows no panning of a walk that is wholly on screen", () => {
        const fitted = layoutFor(BOX, AVAILABLE, true);
        expect(panLimitFor(fitted, MIN_ZOOM)).toEqual(NOWHERE);
    });

    it("allows exactly the overflow once the walk is zoomed into", () => {
        const fitted = layoutFor(BOX, AVAILABLE, true);
        const usable = usableFrom(AVAILABLE, INSET);

        expect(panLimitFor(fitted, 2).x).toBeCloseTo((fitted.content.x * 2 - usable.x) / 2);
    });

    it("allows no panning along an axis the walk barely covers", () => {
        const fitted = layoutFor({ minX: -100, maxX: 100, minY: 0, maxY: 1 }, AVAILABLE, true);
        expect(panLimitFor(fitted, 2).y).toBe(0);
    });
});

describe("clampPan", () => {
    it("keeps a pan the walk has room for", () => {
        const fitted = layoutFor(BOX, AVAILABLE, true);
        expect(clampPan(fitted, 4, { x: 20, y: 20 })).toEqual({ x: 20, y: 20 });
    });

    it("stops the walk being dragged off the screen", () => {
        const fitted = layoutFor(BOX, AVAILABLE, true);
        const limit = panLimitFor(fitted, 2);

        expect(clampPan(fitted, 2, { x: 100000, y: -100000 })).toEqual({ x: limit.x, y: -limit.y });
    });
});

describe("visibleBox", () => {
    it("shows less of the walk the further it is zoomed in", () => {
        const fitted = layoutFor(BOX, AVAILABLE, true);
        const whole = visibleBox(fitted);
        const part = visibleBox(zoomed(fitted, 4, NOWHERE));

        expect(part.maxX - part.minX).toBeCloseTo((whole.maxX - whole.minX) / 4);
    });

    it("holds the whole walk at the fitted zoom", () => {
        const fitted = layoutFor(BOX, AVAILABLE, true);
        const whole = visibleBox(fitted);

        expect(whole.minX).toBeLessThanOrEqual(BOX.minX);
        expect(whole.maxX).toBeGreaterThanOrEqual(BOX.maxX);
        expect(whole.minY).toBeLessThanOrEqual(BOX.minY);
        expect(whole.maxY).toBeGreaterThanOrEqual(BOX.maxY);
    });

    it("follows the walk as it is panned", () => {
        const fitted = layoutFor(BOX, AVAILABLE, true);
        const before = visibleBox(zoomed(fitted, 4, NOWHERE));
        const after = visibleBox(zoomed(fitted, 4, { x: -40, y: 0 }));

        expect(after.minX).toBeGreaterThan(before.minX);
    });
});

describe("the zoom range", () => {
    it("starts fully out and goes no further", () => {
        expect(MIN_ZOOM).toBe(1);
        expect(MAX_ZOOM).toBeGreaterThan(MIN_ZOOM);
    });
});