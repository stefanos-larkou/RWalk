export interface RecordedCall {
    readonly name: string;
    readonly args: number[];
}

export class RecordingContext {
    readonly calls: RecordedCall[] = [];
    readonly strokes: string[] = [];
    readonly transforms: number[][] = [];
    strokeStyle = "";

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

    setTransform(...args: number[]) {
        this.transforms.push(args);
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