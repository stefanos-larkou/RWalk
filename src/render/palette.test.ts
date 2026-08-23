import { describe, expect, it } from "vitest";
import { axisColour, frameColour, gridColour, labelColour, walkerColour } from "./palette";

describe("walkerColour", () => {
    it("gives neighbouring walkers different colours", () => {
        expect(walkerColour(0, "dark")).not.toBe(walkerColour(1, "dark"));
    });

    it("stays distinct across many walkers", () => {
        const colours = new Set(Array.from({ length: 40 }, (_, index) => walkerColour(index, "dark")));
        expect(colours.size).toBe(40);
    });

    it("differs between light and dark", () => {
        expect(walkerColour(3, "light")).not.toBe(walkerColour(3, "dark"));
    });
});

describe("the canvas colours", () => {
    it("keep the grid fainter than the axes", () => {
        expect(gridColour("dark")).not.toBe(axisColour("dark"));
        expect(gridColour("light")).not.toBe(axisColour("light"));
    });

    it("differ between light and dark", () => {
        expect(gridColour("light")).not.toBe(gridColour("dark"));
        expect(axisColour("light")).not.toBe(axisColour("dark"));
    });
});

describe("the scene colours", () => {
    it("carry no alpha, because a three.js material would discard it", () => {
        expect(frameColour("dark")).not.toContain("rgba");
        expect(frameColour("light")).not.toContain("rgba");
    });

    it("differ between light and dark", () => {
        expect(frameColour("light")).not.toBe(frameColour("dark"));
        expect(labelColour("light")).not.toBe(labelColour("dark"));
    });
});