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