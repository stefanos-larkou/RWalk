import { fraction, geometric } from "@stefanos-larkou/sim-kit";
import { MAX_STEPS_PER_SECOND, MIN_STEPS_PER_SECOND, SLIDER_MAX, SLIDER_MIN } from "./constants";

export function speedFrom(slider: number): number {
    return geometric(fraction(slider, SLIDER_MIN, SLIDER_MAX), MIN_STEPS_PER_SECOND, MAX_STEPS_PER_SECOND);
}