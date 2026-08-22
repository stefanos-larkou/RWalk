import { describe, expect, it } from "vitest";
import { stepCounter } from "./counter";

describe("stepCounter", () => {
    it("counts no steps until the walker has moved", () => {
        expect(stepCounter(-1, 1000)).toBe("0 / 1000");
        expect(stepCounter(0, 1000)).toBe("0 / 1000");
    });

    it("counts whole steps only", () => {
        expect(stepCounter(12.9, 1000)).toBe("12 / 1000");
    });

    it("stops at the last step", () => {
        expect(stepCounter(5000, 1000)).toBe("1000 / 1000");
    });
});