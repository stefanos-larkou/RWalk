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
    const across = spread(box.minX, box.maxX);
    const down = spread(box.minY, box.maxY);
    const usable = { x: Math.max(available.x - PADDING * 2, 1), y: Math.max(available.y - PADDING * 2, 1) };

    const fit = { x: usable.x / across.extent, y: usable.y / down.extent };
    const even = Math.min(fit.x, fit.y);
    const scale = isotropic ? { x: even, y: even } : fit;

    return {
        scale,
        origin: {
            x: PADDING + (usable.x - across.extent * scale.x) / 2 - across.min * scale.x,
            y: PADDING + (usable.y - down.extent * scale.y) / 2 + down.max * scale.y
        },
        canvas: available
    };
}

function spread(min: number, max: number): { min: number; max: number; extent: number; } {
    const extent = max - min;
    if (extent > 0) return { min, max, extent };

    return { min: min - 0.5, max: max + 0.5, extent: 1 };
}

export function toPixel(view: ViewLayout, x: number, y: number): Pixel {
    return { x: view.origin.x + x * view.scale.x, y: view.origin.y - y * view.scale.y };
}