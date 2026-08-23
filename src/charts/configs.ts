import type { ChartConfiguration, ChartOptions } from "chart.js";
import type { Histogram } from "../core/statistics";
import { axisColour, expectedColour, gridColour, labelColour, measuredColour, measuredFill } from "../render/palette";

type Mode = "light" | "dark";

export type PlotConfig = ChartConfiguration<"bar" | "line">;

const MOST_POINTS = 400;
const MOST_TICKS = 8;
const BAR_ALPHA = 0.5;
const BAR_SHARE = 0.92;
const BAR_RADIUS = 3;
const MEASURED = "Measured";
const THEORY = "Theory";
const TITLES = {
    displacement: "How far the walkers get",
    distribution: "Where the walkers end up",
    returns: "Walkers that find their way home"
};
const ENTRANCE = { duration: 800, easing: "easeOutQuart" as const };
const TITLE_SIZE = 22;
const AXIS_SIZE = 17;
const TICK_SIZE = 15;

export function thinned<T>(values: T[], most: number): T[] {
    if (values.length <= most) return values;
    const stride = (values.length - 1) / (most - 1);
    return Array.from({ length: most }, (_, index) => values[Math.round(index * stride)] as T);
}

export function displacementConfig(measured: number[], expected: number[], mode: Mode): PlotConfig {
    return {
        type: "line",
        data: {
            datasets: [
                measurement(along(measured), mode),
                line(THEORY, along(expected), expectedColour(mode), true)
            ]
        },
        options: framed(mode, TITLES.displacement, "Steps", "Mean squared displacement")
    };
}

export function distributionConfig(bars: Histogram, curve: number[], mode: Mode): PlotConfig {
    const at = (values: number[]) => bars.centres.map((centre, bin) => ({ x: centre, y: values[bin] ?? 0 }));

    return {
        type: "line",
        data: {
            datasets: [
                {
                    type: "bar" as const,
                    label: MEASURED,
                    data: at(bars.density),
                    backgroundColor: measuredFill(mode, BAR_ALPHA),
                    borderColor: measuredColour(mode),
                    borderWidth: { top: 2, left: 0, right: 0, bottom: 0 },
                    borderRadius: BAR_RADIUS,
                    barPercentage: BAR_SHARE,
                    categoryPercentage: 1,
                    order: 1
                },
                { ...line(THEORY, at(curve), expectedColour(mode), true), order: 0 }
            ]
        },
        options: framed(mode, TITLES.distribution, "Distance from the start", "Probability density", false, { min: 0, max: edgeOf(bars) })
    };
}

export function returnsConfig(fractions: number[], ceiling: number | undefined, mode: Mode): PlotConfig {
    const edge = ceiling === undefined
        ? []
        : [line(THEORY, [{ x: 0, y: ceiling }, { x: fractions.length - 1, y: ceiling }], expectedColour(mode), true)];

    return {
        type: "line",
        data: { datasets: [measurement(along(fractions), mode), ...edge] },
        options: framed(mode, TITLES.returns, "Steps", "Walkers that have been back", true)
    };
}

export function edgeOf(bars: Histogram): number {
    return (bars.centres.at(-1) ?? 0) + bars.width / 2;
}

function along(values: number[]): { x: number; y: number; }[] {
    return thinned(values.map((y, x) => ({ x, y })), MOST_POINTS);
}

function line(label: string, data: { x: number; y: number; }[], colour: string, dashed: boolean) {
    return {
        label,
        data,
        borderColor: colour,
        borderWidth: dashed ? 1.5 : 2,
        borderDash: dashed ? [6, 4] : [],
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: colour,
        pointHitRadius: 12
    };
}

function measurement(data: { x: number; y: number; }[], mode: Mode) {
    return {
        ...line(MEASURED, data, measuredColour(mode), false),
        fill: "origin" as const,
        backgroundColor: measuredFill(mode)
    };
}

function framed(mode: Mode, heading: string, across: string, up: string, share = false, limits?: { min: number; max: number; }): ChartOptions<"bar" | "line"> {
    const upward = axis(mode, up, true);

    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: ENTRANCE,
        normalized: true,
        interaction: { mode: "nearest", intersect: false },
        layout: { padding: { top: 4, right: 8 } },
        plugins: {
            title: { display: true, align: "start", text: heading, color: labelColour(mode), font: { size: TITLE_SIZE, weight: "bold" as const }, padding: { bottom: 16 } },
            legend: {
                align: "end",
                labels: { color: labelColour(mode), font: { size: TICK_SIZE }, usePointStyle: true, pointStyle: "line", boxWidth: 26, padding: 18 }
            },
            tooltip: { usePointStyle: true, padding: 12, cornerRadius: 8, titleFont: { size: TICK_SIZE }, bodyFont: { size: TICK_SIZE } }
        },
        scales: {
            x: { ...axis(mode, across, false), ...limits },
            y: share ? { ...upward, min: 0, max: 1, ticks: { ...upward.ticks, callback: asPercent } } : upward
        }
    };
}

export function asPercent(value: string | number): string {
    return `${Math.round(Number(value) * 100)}%`;
}

function axis(mode: Mode, text: string, ruled: boolean) {
    return {
        type: "linear" as const,
        title: { display: true, text, color: labelColour(mode), font: { size: AXIS_SIZE }, padding: 8 },
        grid: { display: ruled, color: gridColour(mode), drawTicks: false },
        border: { display: false, dash: [4, 4] },
        ticks: { color: axisColour(mode), font: { size: TICK_SIZE }, maxTicksLimit: MOST_TICKS, padding: 8 }
    };
}