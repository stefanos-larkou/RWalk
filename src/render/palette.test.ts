import { describe, expect, it } from "vitest";
import { originColour, walkerColour } from "./palette";

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

describe("originColour", () => {
    it("differs between light and dark", () => {
        expect(originColour("light")).not.toBe(originColour("dark"));
    });
});