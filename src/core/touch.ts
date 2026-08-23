import type { Pixel } from "@stefanos-larkou/sim-kit";

export function apartness(touches: Map<number, Pixel>): number {
    const [first, second] = [...touches.values()];
    if (!first || !second) return 0;
    return Math.hypot(second.x - first.x, second.y - first.y);
}
