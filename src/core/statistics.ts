import { createRandom } from "@stefanos-larkou/sim-kit";
import { squaredDistanceAt } from "./displacement";
import type { WalkOptions } from "./models";
import { walk } from "./walk";

export interface Ensemble {
    readonly walkers: number;
    readonly steps: number;
    readonly squared: Float64Array;
    readonly distances: Float64Array;
    readonly returns: Int32Array;
}

export interface Histogram {
    readonly centres: number[];
    readonly density: number[];
    readonly width: number;
}

export const NEVER = -1;
const HALF_GAMMA = [Math.sqrt(Math.PI), 1, Math.sqrt(Math.PI) / 2];

export function measure(options: WalkOptions, walkers: number, seed: number): Ensemble {
    const random = createRandom(seed);
    const squared = new Float64Array(options.steps + 1);
    const distances = new Float64Array(walkers);
    const returns = new Int32Array(walkers).fill(NEVER);

    for (let walker = 0; walker < walkers; walker += 1) {
        const track = walk(options, random);

        for (let step = 0; step <= options.steps; step += 1) {
            const away = squaredDistanceAt(track, step);

            squared[step] = (squared[step] ?? 0) + away;
            if (away === 0 && step > 0 && returns[walker] === NEVER) returns[walker] = step;
        }

        distances[walker] = Math.sqrt(squaredDistanceAt(track, options.steps));
    }

    return { walkers, steps: options.steps, squared, distances, returns };
}

export function stepVariance(dimensions: number, diagonals: boolean): number {
    if (!diagonals) return 1 / dimensions;
    return 2 * 3 ** (dimensions - 1) / (3 ** dimensions - 1);
}

export function meanSquared(ensemble: Ensemble): number[] {
    return Array.from(ensemble.squared, total => total / Math.max(ensemble.walkers, 1));
}

export function expectedSquared(dimensions: number, diagonals: boolean, steps: number): number[] {
    const perStep = dimensions * stepVariance(dimensions, diagonals);
    return Array.from({ length: steps + 1 }, (_, step) => step * perStep);
}

export function histogram(values: Float64Array, bins: number): Histogram {
    const top = values.reduce((most, value) => Math.max(most, value), 1);
    const width = top / bins;
    const counts = new Float64Array(bins);

    values.forEach(value => {
        const bin = Math.min(Math.floor(value / width), bins - 1);
        counts[bin] = (counts[bin] ?? 0) + 1;
    });

    return {
        centres: Array.from(counts, (_count, bin) => (bin + 0.5) * width),
        density: Array.from(counts, count => count / Math.max(values.length * width, 1)),
        width
    };
}

export function expectedDensity(dimensions: number, diagonals: boolean, steps: number, at: number[]): number[] {
    const spread = Math.sqrt(Math.max(steps, 1) * stepVariance(dimensions, diagonals));
    const scale = 1 / (2 ** (dimensions / 2 - 1) * (HALF_GAMMA[dimensions - 1] ?? 1));

    return at.map(value => {
        const away = value / spread;
        return scale * away ** (dimensions - 1) * Math.exp(-away * away / 2) / spread;
    });
}

export function returnedBy(ensemble: Ensemble): number[] {
    const counts = new Float64Array(ensemble.steps + 1);
    ensemble.returns.forEach(step => {
        if (step !== NEVER) counts[step] = (counts[step] ?? 0) + 1;
    });

    let running = 0;
    return Array.from(counts, count => {
        running += count;
        return running / Math.max(ensemble.walkers, 1);
    });
}