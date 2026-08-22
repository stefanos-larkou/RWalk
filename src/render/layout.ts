import type { Pixel } from "@stefanos-larkou/sim-kit";
import type { Bounds, Box, ViewLayout } from "../core/models";

const PADDING = 12;

export function worldBox(bounds: Bounds, steps: number, dimensions: number): Box {
    if (dimensions === 1) {
        return { minX: 0, maxX: steps, minY: bounds.min[0] ?? 0, maxY: bounds.max[0] ?? 0 };
    }

    return {
        minX: bounds.min[0] ?? 0,
        maxX: bounds.max[0] ?? 0,
        minY: bounds.min[1] ?? 0,
        maxY: bounds.max[1] ?? 0
    };
}

export function layoutFor(box: Box, available: Pixel, isotropic: boolean): ViewLayout {
    const width = Math.max(box.maxX - box.minX, 1);
    const height = Math.max(box.maxY - box.minY, 1);
    const usable = { x: Math.max(available.x - PADDING * 2, 1), y: Math.max(available.y - PADDING * 2, 1) };

    const fit = { x: usable.x / width, y: usable.y / height };
    const even = Math.min(fit.x, fit.y);
    const scale = isotropic ? { x: even, y: even } : fit;

    return {
        scale,
        origin: {
            x: PADDING + (usable.x - width * scale.x) / 2 - box.minX * scale.x,
            y: PADDING + (usable.y - height * scale.y) / 2 + box.maxY * scale.y
        },
        canvas: available
    };
}

export function toPixel(view: ViewLayout, x: number, y: number): Pixel {
    return { x: view.origin.x + x * view.scale.x, y: view.origin.y - y * view.scale.y };
}