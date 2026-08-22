import type { Track } from "../core/models";

export interface Projection {
    readonly x: (track: Track, step: number) => number;
    readonly y: (track: Track, step: number) => number;
}

export function projectionFor(dimensions: number): Projection {
    if (dimensions === 1) {
        return {
            x: (_track, step) => step,
            y: (track, step) => track.positions[step] ?? 0
        };
    }

    return {
        x: (track, step) => track.positions[step * track.dimensions] ?? 0,
        y: (track, step) => track.positions[step * track.dimensions + 1] ?? 0
    };
}