import { describe, expect, it } from "vitest";
import { offsetsFor } from "./offsets";

describe("offsetsFor", () => {
    it("gives two moves per axis without diagonals", () => {
        expect(offsetsFor(2, false)).toHaveLength(4);
        expect(offsetsFor(3, false)).toHaveLength(6);
    });

    it("gives every non-zero lattice step with diagonals", () => {
        expect(offsetsFor(2, true)).toHaveLength(8);
        expect(offsetsFor(3, true)).toHaveLength(26);
    });

    it("offers the same moves in one dimension either way", () => {
        expect(new Set(offsetsFor(1, true).flat())).toEqual(new Set(offsetsFor(1, false).flat()));
    });

    it("never stands still", () => {
        expect(offsetsFor(3, true).filter(offset => offset.every(step => step === 0))).toEqual([]);
    });

    it("moves along exactly one axis without diagonals", () => {
        const axes = offsetsFor(3, false).map(offset => offset.filter(step => step !== 0).length);
        expect(axes).toEqual([1, 1, 1, 1, 1, 1]);
    });
});
