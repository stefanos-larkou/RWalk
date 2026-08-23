import { describe, expect, it } from "vitest";
import { apartness } from "./touch";

function touching(...points: [number, number][]): Map<number, { x: number; y: number; }> {
    return new Map(points.map(([x, y], index) => [index, { x, y }]));
}

describe("apartness", () => {
    it("measures how far two fingers are from each other", () => {
        expect(apartness(touching([0, 0], [3, 4]))).toBe(5);
    });

    it("does not care which finger came first", () => {
        expect(apartness(touching([3, 4], [0, 0]))).toBe(apartness(touching([0, 0], [3, 4])));
    });

    it("is nothing at all when there are not two fingers", () => {
        expect(apartness(touching([1, 1]))).toBe(0);
        expect(apartness(touching())).toBe(0);
    });
});
