import { describe, expect, it } from "vitest";
import { POLYA_RETURN } from "./constants";
import type { WalkOptions } from "./models";
import { expectedDensity, expectedSquared, histogram, meanSquared, measure, NEVER, returnCeiling, returnedBy, stepVariance } from "./statistics";

const STEPS = 400;
const WALKERS = 600;

function ensemble(dimensions: number, diagonals: boolean) {
    return measure({ dimensions, steps: STEPS, diagonals } as WalkOptions, WALKERS, 42);
}

describe("stepVariance", () => {
    it("splits one unit of variance across the axes without diagonals", () => {
        expect([1, 2, 3].map(d => d * stepVariance(d, false))).toEqual([1, 1, 1]);
    });

    it("covers more ground per step with diagonals", () => {
        expect(2 * stepVariance(2, true)).toBeCloseTo(1.5);
        expect(3 * stepVariance(3, true)).toBeCloseTo(27 / 13);
    });

    it("changes nothing in one dimension, where diagonals do not exist", () => {
        expect(stepVariance(1, true)).toBeCloseTo(stepVariance(1, false));
    });
});

describe("meanSquared", () => {
    it("starts at nothing", () => {
        expect(meanSquared(ensemble(2, false))[0]).toBe(0);
    });

    it("matches the analytic line in every dimension", () => {
        [1, 2, 3].forEach(dimensions => {
            const measured = meanSquared(ensemble(dimensions, false)).at(-1) ?? 0;
            expect(measured / STEPS).toBeCloseTo(1, 0.5);
        });
    });

    it("matches the analytic line with diagonals too", () => {
        const measured = meanSquared(ensemble(3, true)).at(-1) ?? 0;
        expect(measured / STEPS).toBeCloseTo(27 / 13, 0.5);
    });

    it("grows in step with what theory expects all the way along", () => {
        const measured = meanSquared(ensemble(2, false));
        const expected = expectedSquared(2, false, STEPS);
        const worst = measured.map((value, step) => Math.abs(value - (expected[step] ?? 0)) / Math.max(step, 1));
        expect(Math.max(...worst)).toBeLessThan(0.4);
    });
});

describe("histogram", () => {
    it("gives back as many bins as it was asked for", () => {
        expect(histogram(ensemble(2, false).distances, 24).centres).toHaveLength(24);
    });

    it("is a density, so its bars add up to one", () => {
        const bars = histogram(ensemble(2, false).distances, 24);
        const total = bars.density.reduce((sum, value) => sum + value * bars.width, 0);
        expect(total).toBeCloseTo(1, 6);
    });
});

describe("expectedDensity", () => {
    it("is a density too", () => {
        const at = Array.from({ length: 400 }, (_, index) => index * 0.25);
        const total = expectedDensity(2, false, STEPS, at).reduce((sum, value) => sum + value * 0.25, 0);
        expect(total).toBeCloseTo(1, 2);
    });

    it("peaks at the origin in one dimension and away from it otherwise", () => {
        const at = Array.from({ length: 200 }, (_, index) => index * 0.5);
        const peak = (dimensions: number) => {
            const curve = expectedDensity(dimensions, false, STEPS, at);
            return curve.indexOf(Math.max(...curve));
        };
        expect(peak(1)).toBe(0);
        expect(peak(3)).toBeGreaterThan(0);
    });

    it("describes the spread the walkers actually had", () => {
        const bars = histogram(ensemble(2, false).distances, 30);
        const curve = expectedDensity(2, false, STEPS, bars.centres);
        const average = (weights: number[]) => bars.centres.reduce((sum, centre, bin) => sum + centre * (weights[bin] ?? 0) * bars.width, 0);
        expect(Math.abs(average(bars.density) - average(curve)) / average(curve)).toBeLessThan(0.1);
    });
});

describe("returnCeiling", () => {
    it("is Polya's constant for a three-dimensional lattice walk", () => {
        expect(returnCeiling(3, false)).toBe(POLYA_RETURN);
    });

    it("has no ceiling where a walk is certain to return", () => {
        expect(returnCeiling(1, false)).toBeUndefined();
        expect(returnCeiling(2, false)).toBeUndefined();
    });

    it("has no ceiling for a lattice the constant was not derived for", () => {
        expect(returnCeiling(3, true)).toBeUndefined();
    });
});

describe("returnedBy", () => {
    it("has nobody home at the start", () => {
        expect(returnedBy(ensemble(2, false))[0]).toBe(0);
    });

    it("never decreases", () => {
        const fractions = returnedBy(ensemble(2, false));
        expect(fractions.every((value, step) => step === 0 || value >= (fractions[step - 1] ?? 0))).toBe(true);
    });

    it("brings far more walkers home in one dimension than in three", () => {
        expect(returnedBy(ensemble(1, false)).at(-1) ?? 0).toBeGreaterThan(returnedBy(ensemble(3, false)).at(-1) ?? 0);
    });

    it("keeps three-dimensional returns under Polya's ceiling", () => {
        expect(returnedBy(ensemble(3, false)).at(-1) ?? 0).toBeLessThan(POLYA_RETURN);
    });

    it("records no return for a walker that never came back", () => {
        expect(measure({ dimensions: 3, steps: 20, diagonals: false } as WalkOptions, 50, 7).returns).toContain(NEVER);
    });
});