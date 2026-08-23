import type { Bounds } from "../core/models";
import { tickStep, ticksBetween } from "../core/ticks";

export interface AxisLabel {
    readonly value: number;
    readonly at: [number, number, number];
    readonly out: [number, number, number];
}

interface Edge {
    readonly along: number;
    readonly corner: (cube: Bounds) => number[];
    readonly out: number[];
}

const EDGES: Edge[] = [
    { along: 0, corner: cube => [0, low(cube, 1), high(cube, 2)], out: [0, -1, 0] },
    { along: 1, corner: cube => [high(cube, 0), 0, high(cube, 2)], out: [1, 0, 0] },
    { along: 2, corner: cube => [high(cube, 0), low(cube, 1), 0], out: [0, -1, 0] }
];
const PANES = [1, 0, 2];

export function paneGridFor(cube: Bounds, target: number): Float32Array {
    return Float32Array.from(PANES.flatMap(pane => {
        const others = [0, 1, 2].filter(axis => axis !== pane);

        return others.flatMap(along => {
            const across = others.find(axis => axis !== along) ?? along;

            return ticksAlong(cube, along, target).flatMap(value => {
                const from = [0, 0, 0];
                const to = [0, 0, 0];

                from[pane] = low(cube, pane);
                to[pane] = low(cube, pane);
                from[along] = value;
                to[along] = value;
                from[across] = low(cube, across);
                to[across] = high(cube, across);

                return [...from, ...to];
            });
        });
    }));
}

export function ticksAlong(cube: Bounds, axis: number, target: number): number[] {
    const min = low(cube, axis);
    const max = high(cube, axis);

    return ticksBetween(min, max, tickStep(max - min, target));
}

export function edgeTicksFor(cube: Bounds, target: number, size: number): Float32Array {
    return Float32Array.from(EDGES.flatMap(edge => ticksAlong(cube, edge.along, target).flatMap(value => {
        const base = seat(edge, cube, value);

        return [...base, ...base.map((coord, axis) => coord + (edge.out[axis] ?? 0) * size)];
    })));
}

export function labelsFor(cube: Bounds, target: number, gap: number): AxisLabel[] {
    return EDGES.flatMap(edge => ticksAlong(cube, edge.along, target).map(value => {
        const base = seat(edge, cube, value);
        const at = base.map((coord, axis) => coord + (edge.out[axis] ?? 0) * gap);

        return {
            value,
            at: [at[0] ?? 0, at[1] ?? 0, at[2] ?? 0] as [number, number, number],
            out: [edge.out[0] ?? 0, edge.out[1] ?? 0, edge.out[2] ?? 0] as [number, number, number]
        };
    }));
}

function seat(edge: Edge, cube: Bounds, value: number): number[] {
    const base = edge.corner(cube);
    base[edge.along] = value;

    return base;
}

function low(cube: Bounds, axis: number): number {
    return cube.min[axis] ?? 0;
}

function high(cube: Bounds, axis: number): number {
    return cube.max[axis] ?? 0;
}
