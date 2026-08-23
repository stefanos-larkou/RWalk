import { ThemeProvider, createTheme } from "@mui/material";
import { render } from "@testing-library/react";
import type { PlotConfig } from "../charts/configs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Statistics } from "./Statistics";

const plotted = vi.hoisted(() => [] as PlotConfig[]);

const DISPLACEMENT = "How far the walkers get";
const DISTRIBUTION = "Where the walkers end up";
const RETURNS = "Walkers that find their way home";

vi.mock("../charts/Plot", () => ({
    Plot: ({ config }: { config: PlotConfig; }) => {
        plotted.push(config);
        return null;
    }
}));

function renderStatistics(dimensions: number, diagonals = false, mode: "light" | "dark" = "light") {
    return render(
        <ThemeProvider theme={createTheme({ palette: { mode } })}>
            <Statistics dimensions={dimensions} steps={40} diagonals={diagonals} seed={1} samples={60} />
        </ThemeProvider>
    );
}

const VARIABLE = createTheme({ cssVariables: { colorSchemeSelector: "class" }, colorSchemes: { light: true, dark: true } });

function renderVariable(mode: "light" | "dark") {
    return render(
        <ThemeProvider theme={VARIABLE} defaultMode={mode} noSsr>
            <Statistics dimensions={2} steps={40} diagonals={false} seed={1} samples={60} />
        </ThemeProvider>
    );
}

function textColours(): unknown[] {
    const first = plotted[0]?.options;

    return [
        first?.plugins?.title?.color,
        first?.plugins?.legend?.labels?.color,
        first?.scales?.x?.title?.color,
        first?.scales?.x?.ticks?.color
    ];
}

function headings(): (string | undefined)[] {
    return plotted.slice(0, 3).map(config => config.options?.plugins?.title?.text as string | undefined);
}

function datasets(heading: string): number {
    return plotted.find(config => config.options?.plugins?.title?.text === heading)?.data.datasets.length ?? 0;
}

describe("Statistics", () => {
    beforeEach(() => {
        plotted.length = 0;
    });

    it("writes its text in the colours of the theme it is under", () => {
        const { unmount } = renderStatistics(2, false, "light");
        const light = textColours();
        unmount();
        plotted.length = 0;
        renderStatistics(2, false, "dark");
        expect(light.filter(Boolean)).toHaveLength(4);
        expect(textColours()).not.toEqual(light);
    });

    it("writes its text in the colours a variable theme is showing, not the ones it was built with", () => {
        const { unmount } = renderVariable("light");
        const light = textColours();
        unmount();
        plotted.length = 0;

        renderVariable("dark");

        expect(light.filter(Boolean)).toHaveLength(4);
        expect(textColours()).not.toEqual(light);
    });

    it("lays the charts out with the bins last, where they have the width", () => {
        renderStatistics(2);
        expect(headings()).toEqual([DISPLACEMENT, RETURNS, DISTRIBUTION]);
    });

    it("draws what theory predicts alongside every measurement", () => {
        renderStatistics(2);
        expect([datasets(DISPLACEMENT), datasets(DISTRIBUTION)]).toEqual([2, 2]);
    });

    it("has a ceiling to hold the returns against in three dimensions", () => {
        renderStatistics(3);
        expect(datasets(RETURNS)).toBe(2);
    });

    it("draws no ceiling where the one it knows does not apply", () => {
        renderStatistics(3, true);
        expect(datasets(RETURNS)).toBe(1);
    });

    it("draws no ceiling where the walkers all come home", () => {
        renderStatistics(1);
        expect(datasets(RETURNS)).toBe(1);
    });
});
