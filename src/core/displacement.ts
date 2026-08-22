import type { Track } from "./models";

export function squaredDistanceAt(track: Track, step: number): number {
    const base = step * track.dimensions;
    let total = 0;

    for (let axis = 0; axis < track.dimensions; axis += 1) {
        const value = track.positions[base + axis] ?? 0;
        total += value * value;
    }

    return total;
}