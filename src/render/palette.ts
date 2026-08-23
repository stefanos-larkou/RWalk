type Mode = "light" | "dark";

const GOLDEN_ANGLE = 137.508;
export const FRAME_OPACITY = 0.36;
export const GRID_OPACITY = 0.09;
const MEASURED = { dark: "200, 80%, 66%", light: "210, 70%, 42%" };
const FILL_ALPHA = 0.14;

export function walkerColour(index: number, mode: Mode): string {
    const hue = Math.round(index * GOLDEN_ANGLE) % 360;
    return mode === "dark" ? `hsla(${hue}, 70%, 66%, 0.85)` : `hsla(${hue}, 62%, 42%, 0.85)`;
}

export function gridColour(mode: Mode): string {
    return mode === "dark" ? "rgba(255, 255, 255, 0.10)" : "rgba(0, 0, 0, 0.09)";
}

export function axisColour(mode: Mode): string {
    return mode === "dark" ? "rgba(255, 255, 255, 0.42)" : "rgba(0, 0, 0, 0.38)";
}

export function frameColour(mode: Mode): string {
    return mode === "dark" ? "#ffffff" : "#000000";
}

export function measuredColour(mode: Mode): string {
    return `hsl(${MEASURED[mode]})`;
}

export function measuredFill(mode: Mode, alpha = FILL_ALPHA): string {
    return `hsla(${MEASURED[mode]}, ${alpha})`;
}

export function expectedColour(mode: Mode): string {
    return mode === "dark" ? "hsl(30, 85%, 66%)" : "hsl(24, 75%, 44%)";
}

export function labelColour(mode: Mode): string {
    return mode === "dark" ? "rgba(255, 255, 255, 0.72)" : "rgba(0, 0, 0, 0.66)";
}