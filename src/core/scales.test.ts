import { describe, expect, it } from "vitest";
import { MAX_STEPS_PER_SECOND, MIN_STEPS_PER_SECOND } from "./constants";
import { speedFrom } from "./scales";

describe("speedFrom", () => {
    it("spans the full speed range", () => {
        expect(speedFrom(1)).toBeCloseTo(MIN_STEPS_PER_SECOND);
        expect(speedFrom(100)).toBeCloseTo(MAX_STEPS_PER_SECOND);
    });

    it("rises geometrically rather than linearly", () => {
        expect(speedFrom(50.5)).toBeLessThan((MIN_STEPS_PER_SECOND + MAX_STEPS_PER_SECOND) / 2);
    });

    it("multiplies by a constant factor for each equal move of the slider", () => {
        expect(speedFrom(50) / speedFrom(25)).toBeCloseTo(speedFrom(75) / speedFrom(50));
    });
});