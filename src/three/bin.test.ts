import { describe, expect, it, vi } from "vitest";
import { createBin } from "./bin";

function fake() {
    return { dispose: vi.fn() };
}

describe("createBin", () => {
    it("releases everything it was given", () => {
        const bin = createBin();
        const items = [fake(), fake(), fake()];
        items.forEach(item => bin.add(item));
        bin.release();
        expect(items.map(item => item.dispose.mock.calls.length)).toEqual([1, 1, 1]);
    });

    it("hands back what it was given, so a construction can be wrapped", () => {
        const bin = createBin();
        const item = fake();
        expect(bin.add(item)).toBe(item);
    });

    it("releases nothing twice", () => {
        const bin = createBin();
        const item = fake();
        bin.add(item);
        bin.release();
        bin.release();
        expect(item.dispose).toHaveBeenCalledTimes(1);
    });

    it("has nothing to do when it was given nothing", () => {
        expect(() => createBin().release()).not.toThrow();
    });
});