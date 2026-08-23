const NICE_STEPS = [1, 2, 5, 10];

export function tickStep(extent: number, target: number): number {
    if (!(extent > 0)) return 1;

    const rough = extent / Math.max(target, 1);
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const normalised = rough / magnitude;
    const nice = NICE_STEPS.find(step => normalised <= step) ?? 10;

    return Math.max(nice * magnitude, 1);
}

export function ticksBetween(min: number, max: number, step: number): number[] {
    const first = Math.ceil(min / step) * step;
    const count = Math.floor((max - first) / step) + 1;

    return Array.from({ length: Math.max(count, 0) }, (_, index) => first + index * step);
}