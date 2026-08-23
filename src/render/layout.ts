import { withinRange } from "@stefanos-larkou/sim-kit";
import type { Pixel } from "@stefanos-larkou/sim-kit";
import type { Bounds, Box, ViewLayout } from "../core/models";

export const INSET = { left: 56, right: 16, top: 16, bottom: 32 };

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

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 30;

export function usableFrom(canvas: Pixel): Pixel {
    return {
        x: Math.max(canvas.x - INSET.left - INSET.right, 1),
        y: Math.max(canvas.y - INSET.top - INSET.bottom, 1)
    };
}

export function layoutFor(box: Box, available: Pixel, isotropic: boolean): ViewLayout {
    const across = spread(box.minX, box.maxX);
    const down = spread(box.minY, box.maxY);
    const usable = usableFrom(available);

    const fit = { x: usable.x / across.extent, y: usable.y / down.extent };
    const even = Math.min(fit.x, fit.y);
    const scale = isotropic ? { x: even, y: even } : fit;

    return {
        scale,
        origin: {
            x: INSET.left + (usable.x - across.extent * scale.x) / 2 - across.min * scale.x,
            y: INSET.top + (usable.y - down.extent * scale.y) / 2 + down.max * scale.y
        },
        content: { x: across.extent * scale.x, y: down.extent * scale.y },
        canvas: available
    };
}

export function zoomed(view: ViewLayout, zoom: number, offset: Pixel): ViewLayout {
    const usable = usableFrom(view.canvas);
    const focus = { x: INSET.left + usable.x / 2, y: INSET.top + usable.y / 2 };

    return {
        scale: { x: view.scale.x * zoom, y: view.scale.y * zoom },
        origin: {
            x: focus.x + (view.origin.x - focus.x) * zoom + offset.x,
            y: focus.y + (view.origin.y - focus.y) * zoom + offset.y
        },
        content: { x: view.content.x * zoom, y: view.content.y * zoom },
        canvas: view.canvas
    };
}

export function panLimitFor(view: ViewLayout, zoom: number): Pixel {
    const usable = usableFrom(view.canvas);

    return {
        x: Math.max((view.content.x * zoom - usable.x) / 2, 0),
        y: Math.max((view.content.y * zoom - usable.y) / 2, 0)
    };
}

export function clampPan(view: ViewLayout, zoom: number, offset: Pixel): Pixel {
    const limit = panLimitFor(view, zoom);

    return {
        x: withinRange(offset.x, -limit.x, limit.x),
        y: withinRange(offset.y, -limit.y, limit.y)
    };
}

export function visibleBox(view: ViewLayout): Box {
    const right = Math.max(view.canvas.x - INSET.right, INSET.left);
    const bottom = Math.max(view.canvas.y - INSET.bottom, INSET.top);

    return {
        minX: (INSET.left - view.origin.x) / view.scale.x,
        maxX: (right - view.origin.x) / view.scale.x,
        minY: (view.origin.y - bottom) / view.scale.y,
        maxY: (view.origin.y - INSET.top) / view.scale.y
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