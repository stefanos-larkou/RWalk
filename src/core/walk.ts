import { createRandom } from "@stefanos-larkou/sim-kit";
import type { Track, WalkOptions } from "./models";
import { offsetsFor } from "./offsets";

export function walk(options: WalkOptions, random: () => number): Track {
    const { dimensions, steps, diagonals } = options;
    const offsets = offsetsFor(dimensions, diagonals);
    const positions = new Int32Array((steps + 1) * dimensions);

    for (let step = 1; step <= steps; step += 1) {
        const offset = offsets[Math.floor(random() * offsets.length)];
        if (!offset) throw new Error("Offset index out of range.");

        const from = (step - 1) * dimensions;
        const to = step * dimensions;

        for (let axis = 0; axis < dimensions; axis += 1) {
            positions[to + axis] = (positions[from + axis] ?? 0) + (offset[axis] ?? 0);
        }
    }

    return { dimensions, positions };
}

export function walksFor(options: WalkOptions, walkers: number, seed: number): Track[] {
    const random = createRandom(seed);
    return Array.from({ length: walkers }, () => walk(options, random));
}

export function positionAt(track: Track, step: number): number[] {
    const base = step * track.dimensions;
    return Array.from({ length: track.dimensions }, (_, axis) => track.positions[base + axis] ?? 0);
}

export function stepsIn(track: Track): number {
    return track.positions.length / track.dimensions - 1;
}