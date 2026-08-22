import type { Pixel } from "@stefanos-larkou/sim-kit";

export interface WalkOptions {
    dimensions: number;
    steps: number;
    diagonals: boolean;
}

export interface Track {
    readonly dimensions: number;
    readonly positions: Int32Array;
}

export interface Bounds {
    readonly min: number[];
    readonly max: number[];
}

export interface Box {
    readonly minX: number;
    readonly maxX: number;
    readonly minY: number;
    readonly maxY: number;
}

export interface ViewLayout {
    readonly scale: Pixel;
    readonly origin: Pixel;
    readonly canvas: Pixel;
}