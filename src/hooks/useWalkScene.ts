import { useMemo } from "react";
import { anchoredAtOrigin, boundsFor } from "../core/bounds";
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
    span: number;
}

const EMPTY_BOUNDS: Bounds = { min: [], max: [] };

export function useWalkScene(options: SceneOptions): Scene {
    const { dimensions, walkers, steps, diagonals, seed, stableLimits, upTo } = options;

    const tracks = useMemo(
        () => walksFor({ dimensions, steps, diagonals }, walkers, seed),
        [dimensions, steps, diagonals, walkers, seed]
    );

    const boxes = useMemo(() => boundsFor(tracks), [tracks]);
    const revealed = Math.max(Math.min(upTo, boxes.length - 1), 0);
    const reached = boxes[revealed] ?? EMPTY_BOUNDS;
    const bounds = stableLimits ? boxes.at(-1) ?? EMPTY_BOUNDS : anchoredAtOrigin(reached);
    const span = stableLimits ? steps : Math.max(upTo, 1);

    return { tracks, bounds, span };
}