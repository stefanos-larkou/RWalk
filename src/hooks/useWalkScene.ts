import { useMemo } from "react";
import { boundsFor } from "../core/bounds";
import type { Bounds, Track } from "../core/models";
import { walksFor } from "../core/walk";

export interface SceneOptions {
    dimensions: number;
    walkers: number;
    steps: number;
    diagonals: boolean;
    seed: number;
    stableLimits: boolean;
    upTo: number;
}

export interface Scene {
    tracks: Track[];
    bounds: Bounds;
}

const EMPTY_BOUNDS: Bounds = { min: [], max: [] };

export function useWalkScene(options: SceneOptions): Scene {
    const { dimensions, walkers, steps, diagonals, seed, stableLimits, upTo } = options;

    const tracks = useMemo(
        () => walksFor({ dimensions, steps, diagonals }, walkers, seed),
        [dimensions, steps, diagonals, walkers, seed]
    );

    const boxes = useMemo(() => boundsFor(tracks), [tracks]);
    const bounds = (stableLimits ? boxes.at(-1) : boxes[Math.min(upTo, boxes.length - 1)]) ?? EMPTY_BOUNDS;

    return { tracks, bounds };
}