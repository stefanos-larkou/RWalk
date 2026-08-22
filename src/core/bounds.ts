import type { Bounds, Track } from "./models";
import { stepsIn } from "./walk";

export function boundsFor(tracks: Track[]): Bounds[] {
    const first = tracks[0];
    if (!first) return [];

    const dimensions = first.dimensions;
    const min = new Array<number>(dimensions).fill(0);
    const max = new Array<number>(dimensions).fill(0);

    return Array.from({ length: stepsIn(first) + 1 }, (_, step) => {
        for (const track of tracks) {
            for (let axis = 0; axis < dimensions; axis += 1) {
                const value = track.positions[step * dimensions + axis] ?? 0;
                min[axis] = Math.min(min[axis] ?? 0, value);
                max[axis] = Math.max(max[axis] ?? 0, value);
            }
        }

        return { min: [...min], max: [...max] };
    });
}

export function anchoredAtOrigin(bounds: Bounds): Bounds {
    const reach = bounds.min.map((value, axis) => Math.max(Math.abs(value), Math.abs(bounds.max[axis] ?? 0)));

    return { min: reach.map(value => -value), max: [...reach] };
}