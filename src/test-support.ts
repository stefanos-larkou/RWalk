export interface RecordedCall {
    readonly name: string;
    readonly args: number[];
}

export interface RecordedLabel {
    readonly text: string;
    readonly x: number;
    readonly y: number;
}

const FONT_WIDTH_SHARE = 8;

export class RecordingContext {
    readonly calls: RecordedCall[] = [];
    readonly strokes: string[] = [];
    readonly labels: RecordedLabel[] = [];
    readonly transforms: number[][] = [];
    strokeStyle = "";
    fillStyle = "";
    font = "";
    textAlign = "";
    textBaseline = "";

    clearRect(...args: number[]) {
        this.calls.push({ name: "clearRect", args });
    }

    beginPath() {
        this.calls.push({ name: "beginPath", args: [] });
    }

    moveTo(...args: number[]) {
        this.calls.push({ name: "moveTo", args });
    }

    lineTo(...args: number[]) {
        this.calls.push({ name: "lineTo", args });
    }

    stroke() {
        this.calls.push({ name: "stroke", args: [] });
        this.strokes.push(this.strokeStyle);
    }

    fillText(text: string, x: number, y: number) {
        this.labels.push({ text, x, y });
        this.calls.push({ name: "fillText", args: [x, y] });
    }

    setTransform(...args: number[]) {
        this.transforms.push(args);
    }

    save() {
        this.calls.push({ name: "save", args: [] });
    }

    restore() {
        this.calls.push({ name: "restore", args: [] });
    }

    rect(...args: number[]) {
        this.calls.push({ name: "rect", args });
    }

    clip() {
        this.calls.push({ name: "clip", args: [] });
    }

    measureText(text: string): TextMetrics {
        return { width: text.length * FONT_WIDTH_SHARE } as TextMetrics;
    }

    named(name: string): RecordedCall[] {
        return this.calls.filter(call => call.name === name);
    }

    get api(): CanvasRenderingContext2D {
        return this as unknown as CanvasRenderingContext2D;
    }
}

export const contexts: RecordingContext[] = [];

const held = new WeakMap<HTMLCanvasElement, RecordingContext>();

export function stubCanvas(): void {
    HTMLCanvasElement.prototype.getContext = (function getContext(this: HTMLCanvasElement, kind: string) {
        if (kind !== "2d") return null;

        const existing = held.get(this);
        if (existing) return existing.api;

        const context = new RecordingContext();
        held.set(this, context);
        contexts.push(context);

        return context.api;
    }) as unknown as HTMLCanvasElement["getContext"];
}

export function resetContexts(): void {
    contexts.length = 0;
}

export function stubPointerCapture(): void {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => { };
    Element.prototype.releasePointerCapture = () => { };
}