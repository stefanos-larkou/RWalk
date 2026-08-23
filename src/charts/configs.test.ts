import { describe, expect, it } from "vitest";
import { POLYA_RETURN } from "../core/constants";
import { histogram, measure } from "../core/statistics";
import type { WalkOptions } from "../core/models";
import { asPercent, displacementConfig, distributionConfig, returnsConfig, thinned } from "./configs";

const OPTIONS: WalkOptions = { dimensions: 2, steps: 200, diagonals: false };

describe("thinned", () => {
    it("leaves a short series alone", () => {
        expect(thinned([1, 2, 3], 10)).toEqual([1, 2, 3]);
    });

    it("never gives back more than it was allowed", () => {
        expect(thinned(Array.from({ length: 9000 }, (_, index) => index), 400)).toHaveLength(400);
    });

    it("keeps both ends", () => {
        const thin = thinned(Array.from({ length: 9000 }, (_, index) => index), 400);
        expect([thin[0], thin.at(-1)]).toEqual([0, 8999]);
    });
});

describe("asPercent", () => {
    it("writes a fraction as a share", () => {
        expect([0, 0.02, 0.3405, 1].map(asPercent)).toEqual(["0%", "2%", "34%", "100%"]);
    });
});

describe("displacementConfig", () => {
    it("draws the measurement against the theory", () => {
        const config = displacementConfig([0, 1, 2], [0, 1, 2], "dark");
        expect(config.data.datasets.map(set => set.label)).toEqual(["Measured", "Theory"]);
    });

    it("dashes the theory and not the measurement", () => {
        const config = displacementConfig([0, 1, 2], [0, 1, 2], "dark");
        expect(config.data.datasets[0]?.borderDash).toEqual([]);
        expect(config.data.datasets[1]?.borderDash).not.toEqual([]);
    });

    it("thins a long run", () => {
        const long = Array.from({ length: 9000 }, (_, index) => index);
        expect(displacementConfig(long, long, "dark").data.datasets[0]?.data).toHaveLength(400);
    });
});

describe("every chart", () => {
    const configs = [
        displacementConfig([0, 1], [0, 1], "dark"),
        distributionConfig(histogram(measure(OPTIONS, 40, 1).distances, 8), [0], "dark"),
        returnsConfig([0, 0.1], undefined, "dark")
    ];

    it("carries a heading", () => {
        configs.forEach(config => expect(config.options?.plugins?.title?.text).toBeTruthy());
    });

    it("names both of its axes", () => {
        configs.forEach(config => {
            expect(config.options?.scales?.x?.title?.text).toBeTruthy();
            expect(config.options?.scales?.y?.title?.text).toBeTruthy();
        });
    });

    it("makes the heading larger than the axis names", () => {
        const heading = configs[0]?.options?.plugins?.title?.font;
        const axis = configs[0]?.options?.scales?.x?.title?.font;
        expect(Number(heading && "size" in heading ? heading.size : 0)).toBeGreaterThan(Number(axis && "size" in axis ? axis.size : 0));
    });
});

describe("distributionConfig", () => {
    it("steps the measured bars and smooths the theory", () => {
        const bars = histogram(measure(OPTIONS, 40, 1).distances, 12);
        const config = distributionConfig(bars, bars.centres.map(() => 0), "dark");
        expect(config.data.datasets[0]).toHaveProperty("stepped", true);
        expect(config.data.datasets[1]).not.toHaveProperty("stepped");
    });
});

describe("returnsConfig", () => {
    it("draws the ceiling when there is one", () => {
        expect(returnsConfig([0, 0.1], POLYA_RETURN, "dark").data.datasets).toHaveLength(2);
    });

    it("draws no ceiling when none applies", () => {
        expect(returnsConfig([0, 0.1], undefined, "dark").data.datasets).toHaveLength(1);
    });

    it("reads its axis as a share of the walkers, not a count of them", () => {
        const ticks = returnsConfig([0, 0.1], undefined, "dark").options?.scales?.y?.ticks;
        expect(ticks && "callback" in ticks ? typeof ticks.callback : "").toBe("function");
    });

    it("spans the whole range a share can take", () => {
        const scale = returnsConfig([0, 0.1], undefined, "dark").options?.scales?.y;
        expect([scale?.min, scale?.max]).toEqual([0, 1]);
    });
});