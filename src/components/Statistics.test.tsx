import { ThemeProvider, createTheme } from "@mui/material";
import { render } from "@testing-library/react";
import type { ChartConfiguration } from "chart.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Statistics } from "./Statistics";

const plotted = vi.hoisted(() => [] as ChartConfiguration<"line">[]);

vi.mock("../charts/Plot", () => ({
    Plot: ({ config }: { config: ChartConfiguration<"line">; }) => {
        plotted.push(config);
        return null;
    }
}));

function renderStatistics(dimensions: number, diagonals = false) {
    return render(
        <ThemeProvider theme={createTheme()}>
            <Statistics dimensions={dimensions} steps={40} diagonals={diagonals} seed={1} samples={60} />
        </ThemeProvider>
    );
}

function headings(): (string | undefined)[] {
    return plotted.slice(0, 3).map(config => config.options?.plugins?.title?.text as string | undefined);
}

function datasets(chart: number): number {
    return plotted[chart]?.data.datasets.length ?? 0;
}

describe("Statistics", () => {
    beforeEach(() => {
        plotted.length = 0;
    });

    it("gives each chart the measurement it is about", () => {
        renderStatistics(2);

        expect(headings()).toEqual([
            "How far the walkers get",
            "Where the walkers end up",
            "Walkers that find their way home"
        ]);
    });

    it("draws what theory predicts alongside every measurement", () => {
        renderStatistics(2);

        expect([datasets(0), datasets(1)]).toEqual([2, 2]);
    });

    it("has a ceiling to hold the returns against in three dimensions", () => {
        renderStatistics(3);
        expect(datasets(2)).toBe(2);
    });

    it("draws no ceiling where the one it knows does not apply", () => {
        renderStatistics(3, true);
        expect(datasets(2)).toBe(1);
    });

    it("draws no ceiling where the walkers all come home", () => {
        renderStatistics(1);
        expect(datasets(2)).toBe(1);
    });
});
