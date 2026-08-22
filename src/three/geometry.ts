import type { Bounds, Track } from "../core/models";

export function verticesFor(track: Track, upTo: number): Float32Array {
    const count = Math.max(upTo + 1, 0);
    const vertices = new Float32Array(count * 3);

    for (let step = 0; step < count; step += 1) {
        const base = step * track.dimensions;
        vertices[step * 3] = track.positions[base] ?? 0;
        vertices[step * 3 + 1] = track.positions[base + 1] ?? 0;
        vertices[step * 3 + 2] = track.positions[base + 2] ?? 0;
    }

    return vertices;
}

export function boxEdgesFor(bounds: Bounds): Float32Array {
    const lowX = bounds.min[0] ?? 0;
    const lowY = bounds.min[1] ?? 0;
    const lowZ = bounds.min[2] ?? 0;
    const highX = bounds.max[0] ?? 0;
    const highY = bounds.max[1] ?? 0;
    const highZ = bounds.max[2] ?? 0;

    const corners = [
        [lowX, lowY, lowZ], [highX, lowY, lowZ], [highX, highY, lowZ], [lowX, highY, lowZ],
        [lowX, lowY, highZ], [highX, lowY, highZ], [highX, highY, highZ], [lowX, highY, highZ]
    ];

    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    return Float32Array.from(edges.flatMap(([from, to]) => [
        ...(corners[from ?? 0] ?? []),
        ...(corners[to ?? 0] ?? [])
    ]));
}

export function centreOf(bounds: Bounds): [number, number, number] {
    return [0, 1, 2].map(axis => ((bounds.min[axis] ?? 0) + (bounds.max[axis] ?? 0)) / 2) as [number, number, number];
}

export function radiusOf(bounds: Bounds): number {
    const spans = [0, 1, 2].map(axis => (bounds.max[axis] ?? 0) - (bounds.min[axis] ?? 0));
    return Math.max(Math.hypot(...spans) / 2, 1);
}

export function cubeAround(bounds: Bounds): Bounds {
    const centre = centreOf(bounds);
    const spans = [0, 1, 2].map(axis => (bounds.max[axis] ?? 0) - (bounds.min[axis] ?? 0));
    const half = Math.max(...spans, 1) / 2;

    return {
        min: centre.map(value => value - half),
        max: centre.map(value => value + half)
    };
}