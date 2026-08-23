import { render } from "@testing-library/react";
import type { ChartConfiguration } from "chart.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Plot } from "./Plot";

interface Built {
    data: unknown;
    options: unknown;
    readonly updates: (string | undefined)[];
    destroyed: number;
}

const built = vi.hoisted(() => [] as Built[]);

vi.mock("chart.js", () => {
    class FakeChart {
        static register() { }

        data: unknown;
        options: unknown;
        readonly updates: (string | undefined)[] = [];
        destroyed = 0;

        constructor(_canvas: HTMLCanvasElement, config: { data: unknown; }) {
            this.data = config.data;
            built.push(this);
        }

        update(mode?: string) {
            this.updates.push(mode);
        }

        destroy() {
            this.destroyed += 1;
        }
    }

    return { Chart: FakeChart, Legend: {}, LineController: {}, LineElement: {}, LinearScale: {}, PointElement: {}, Title: {}, Tooltip: {} };
});

function configFor(label: string): ChartConfiguration<"line"> {
    return { type: "line", data: { datasets: [{ label, data: [] }] }, options: {} };
}

function only(): Built {
    expect(built).toHaveLength(1);
    return built[0] as Built;
}

describe("Plot", () => {
    beforeEach(() => {
        built.length = 0;
    });

    it("hands new data to the chart it already has", () => {
        const { rerender } = render(<Plot config={configFor("first")} />);
        rerender(<Plot config={configFor("second")} />);
        expect(only().data).toEqual(configFor("second").data);
    });

    it("animates the first draw and no other", () => {
        const { rerender } = render(<Plot config={configFor("first")} />);
        rerender(<Plot config={configFor("second")} />);
        rerender(<Plot config={configFor("third")} />);
        expect(only().updates).toEqual([undefined, "none", "none"]);
    });

    it("destroys the chart it leaves behind", () => {
        const { unmount } = render(<Plot config={configFor("first")} />);
        const chart = only();
        unmount();
        expect(chart.destroyed).toBe(1);
    });
});
