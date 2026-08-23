import { describe, expect, it } from "vitest";
import { POLYA_RETURN } from "../core/constants";
import { histogram, measure } from "../core/statistics";
import type { WalkOptions } from "../core/models";
import { asPercent, displacementConfig, distributionConfig, edgeOf, returnsConfig, thinned } from "./configs";


const OPTIONS: WalkOptions = { dimensions: 2, steps: 200, diagonals: false };

function filling(set: unknown): unknown {
    return (set as { fill?: unknown; })?.fill ?? false;
}

function dashing(set: unknown): unknown {
    return (set as { borderDash?: unknown; })?.borderDash;
}

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
        expect(dashing(config.data.datasets[0])).toEqual([]);
        expect(dashing(config.data.datasets[1])).not.toEqual([]);
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

    it("leaves the theory a bare line over whatever was measured", () => {
        configs.forEach(config => expect(filling(config.data.datasets[1])).toBe(false));
    });

    it("fills under a measurement drawn as a curve", () => {
        const curved = configs.filter(config => config.data.datasets[0]?.type !== "bar");

        expect(curved).toHaveLength(2);
        curved.forEach(config => expect(filling(config.data.datasets[0])).toBe("origin"));
    });

    it("rules the axis a value is read off and not the other", () => {
        configs.forEach(config => {
            expect(config.options?.scales?.y?.grid?.display).toBe(true);
            expect(config.options?.scales?.x?.grid?.display).toBe(false);
        });
    });

    it("makes the heading larger than the axis names", () => {
        const heading = configs[0]?.options?.plugins?.title?.font;
        const axis = configs[0]?.options?.scales?.x?.title?.font;
        expect(Number(heading && "size" in heading ? heading.size : 0)).toBeGreaterThan(Number(axis && "size" in axis ? axis.size : 0));
    });
});

describe("distributionConfig", () => {
    const bars = histogram(measure(OPTIONS, 40, 1).distances, 12);
    const config = distributionConfig(bars, bars.centres.map(() => 0), "dark");

    it("stands the measurement in bars and draws the theory as a curve", () => {
        expect(config.data.datasets[0]).toHaveProperty("type", "bar");
        expect(config.data.datasets[1]?.type ?? "line").toBe("line");
    });

    it("gives every bin a bar", () => {
        expect(config.data.datasets[0]?.data).toHaveLength(bars.centres.length);
    });

    it("leaves the bars a gap to be told apart by", () => {
        const columns = config.data.datasets[0] as { barPercentage?: number; };
        expect(columns.barPercentage).toBeGreaterThan(0.5);
        expect(columns.barPercentage).toBeLessThan(1);
    });

    it("draws the curve over the bars rather than behind them", () => {
        const bars = config.data.datasets[0] as { order?: number; };
        const curve = config.data.datasets[1] as { order?: number; };
        expect(Number(curve.order)).toBeLessThan(Number(bars.order));
    });

    it("shows only the distances a walker can have covered", () => {
        expect(config.options?.scales?.x?.min).toBe(0);
        expect(config.options?.scales?.x?.max).toBeCloseTo(edgeOf(bars));
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