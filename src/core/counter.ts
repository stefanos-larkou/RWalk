import { withinRange } from "@stefanos-larkou/sim-kit";

export function stepCounter(index: number, steps: number): string {
    return `${withinRange(Math.floor(index), 0, steps)} / ${steps}`;
}