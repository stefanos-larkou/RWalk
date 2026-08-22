type Mode = "light" | "dark";

const GOLDEN_ANGLE = 137.508;

export function walkerColour(index: number, mode: Mode): string {
    const hue = Math.round(index * GOLDEN_ANGLE) % 360;
    return mode === "dark" ? `hsla(${hue}, 70%, 66%, 0.85)` : `hsla(${hue}, 62%, 42%, 0.85)`;
}

export function originColour(mode: Mode): string {
    return mode === "dark" ? "rgba(255, 255, 255, 0.28)" : "rgba(0, 0, 0, 0.22)";
}