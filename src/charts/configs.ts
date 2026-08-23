import type { ChartConfiguration, ChartOptions } from "chart.js";
import type { Histogram } from "../core/statistics";
import { axisColour, expectedColour, gridColour, labelColour, measuredColour } from "../render/palette";

type Mode = "light" | "dark";

const MOST_POINTS = 400;
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

export function displacementConfig(measured: number[], expected: number[], mode: Mode): ChartConfiguration<"line"> {
    return {
        type: "line",
        data: {
            datasets: [
                line(MEASURED, along(measured), measuredColour(mode), false),
                line(THEORY, along(expected), expectedColour(mode), true)
            ]
        },
        options: framed(mode, TITLES.displacement, "Steps", "Mean squared displacement")
    };
}

export function distributionConfig(bars: Histogram, curve: number[], mode: Mode): ChartConfiguration<"line"> {
    const at = (values: number[]) => bars.centres.map((centre, bin) => ({ x: centre, y: values[bin] ?? 0 }));

    return {
        type: "line",
        data: {
            datasets: [
                { ...line(MEASURED, at(bars.density), measuredColour(mode), false), stepped: true },
                line(THEORY, at(curve), expectedColour(mode), true)
            ]
        },
        options: framed(mode, TITLES.distribution, "Distance from the start", "Probability density")
    };
}

export function returnsConfig(fractions: number[], ceiling: number | undefined, mode: Mode): ChartConfiguration<"line"> {
    const edge = ceiling === undefined
        ? []
        : [line(THEORY, [{ x: 0, y: ceiling }, { x: fractions.length - 1, y: ceiling }], expectedColour(mode), true)];

    return {
        type: "line",
        data: { datasets: [line(MEASURED, along(fractions), measuredColour(mode), false), ...edge] },
        options: framed(mode, TITLES.returns, "Steps", "Walkers that have been back", true)
    };
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
        pointRadius: 0
    };
}

function framed(mode: Mode, heading: string, across: string, up: string, share = false): ChartOptions<"line"> {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: ENTRANCE,
        normalized: true,
        interaction: { mode: "nearest", intersect: false },
        plugins: {
            title: { display: true, text: heading, color: labelColour(mode), font: { size: TITLE_SIZE, weight: "bold" as const }, padding: { bottom: 12 } },
            legend: { labels: { color: labelColour(mode), font: { size: TICK_SIZE } } }
        },
        scales: {
            x: axis(mode, across),
            y: share ? { ...axis(mode, up), min: 0, max: 1, ticks: { ...axis(mode, up).ticks, callback: asPercent } } : axis(mode, up)
        }
    };
}

export function asPercent(value: string | number): string {
    return `${Math.round(Number(value) * 100)}%`;
}

function axis(mode: Mode, text: string) {
    return {
        type: "linear" as const,
        title: { display: true, text, color: labelColour(mode), font: { size: AXIS_SIZE } },
        grid: { color: gridColour(mode) },
        ticks: { color: axisColour(mode), font: { size: TICK_SIZE } }
    };
}