import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SceneOptions } from "./useWalkScene";
import { useWalkScene } from "./useWalkScene";

const OPTIONS: SceneOptions = {
    dimensions: 2, walkers: 4, steps: 100, diagonals: false, seed: 7, stableLimits: true, upTo: 100
};

function scene(overrides: Partial<SceneOptions> = {}) {
    return renderHook(() => useWalkScene({ ...OPTIONS, ...overrides })).result.current;
}

describe("useWalkScene", () => {
    it("makes one track per walker", () => {
        expect(scene().tracks).toHaveLength(4);
    });

    it("reports the whole walk's reach with stable limits", () => {
        expect(scene({ stableLimits: true, upTo: 10 }).bounds).toEqual(scene({ stableLimits: true, upTo: 100 }).bounds);
    });

    it("follows the walk when limits are not stable", () => {
        const early = scene({ stableLimits: false, upTo: 10 });
        const late = scene({ stableLimits: false, upTo: 100 });
        expect(late.bounds).not.toEqual(early.bounds);
    });

    it("spans the whole run with stable limits", () => {
        expect(scene({ stableLimits: true, upTo: 10 }).span).toBe(100);
    });

    it("spans only what has been walked when limits are not stable", () => {
        expect(scene({ stableLimits: false, upTo: 10 }).span).toBe(10);
    });

    it("never spans nothing before the walk has started", () => {
        expect(scene({ stableLimits: false, upTo: -1 }).span).toBeGreaterThan(0);
    });

    it("repeats exactly for the same seed", () => {
        expect(scene().tracks[0]?.positions).toEqual(scene().tracks[0]?.positions);
    });

    it("changes with the seed", () => {
        expect(scene({ seed: 1 }).tracks[0]?.positions).not.toEqual(scene({ seed: 2 }).tracks[0]?.positions);
    });
});