export function offsetsFor(dimensions: number, diagonals: boolean): number[][] {
    if (!diagonals) return axisOffsets(dimensions);
    return latticeOffsets(dimensions).filter(offset => offset.some(step => step !== 0));
}

function axisOffsets(dimensions: number): number[][] {
    return [1, -1].flatMap(direction => Array.from({ length: dimensions }, (_, axis) =>
        Array.from({ length: dimensions }, (_, other) => other === axis ? direction : 0)));
}

function latticeOffsets(dimensions: number): number[][] {
    if (dimensions === 0) return [[]];
    return latticeOffsets(dimensions - 1).flatMap(rest => [-1, 0, 1].map(step => [...rest, step]));
}
