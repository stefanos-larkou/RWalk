import { describe, expect, it } from "vitest";
import { tickStep, ticksBetween } from "./ticks";

function isNice(step: number): boolean {
    const magnitude = 10 ** Math.floor(Math.log10(step));
    return [1, 2, 5, 10].includes(step / magnitude);
}

describe("tickStep", () => {
    it("always lands on a readable interval", () => {
        const steps = [3, 7, 40, 137, 900, 1000, 4321, 10000].map(extent => tickStep(extent, 5));
        expect(steps.every(isNice)).toBe(true);
    });

    it("keeps the number of ticks near what was asked for", () => {
        const counts = [40, 137, 900, 4321, 10000].map(extent => extent / tickStep(extent, 5));
        expect(counts.every(count => count >= 2 && count <= 10)).toBe(true);
    });

    it("never divides a lattice into fractions", () => {
        expect(tickStep(3, 5)).toBeGreaterThanOrEqual(1);
        expect(tickStep(1, 5)).toBeGreaterThanOrEqual(1);
    });

    it("has an answer for a walk that has not moved", () => {
        expect(tickStep(0, 5)).toBe(1);
    });
});

describe("ticksBetween", () => {
    it("gives only multiples of the step", () => {
        expect(ticksBetween(-30, 50, 20).every(value => value % 20 === 0)).toBe(true);
    });

    it("stays inside the range it was given", () => {
        const ticks = ticksBetween(-30, 50, 20);
        expect(ticks.every(value => value >= -30 && value <= 50)).toBe(true);
    });

    it("includes the origin when the range spans it", () => {
        expect(ticksBetween(-30, 50, 20)).toContain(0);
    });

    it("gives nothing when the range is narrower than a step", () => {
        expect(ticksBetween(3, 8, 20)).toEqual([]);
    });
});