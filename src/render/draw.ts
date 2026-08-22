import type { Pixel } from "@stefanos-larkou/sim-kit";
import type { Track, ViewLayout } from "../core/models";
import { toPixel } from "./layout";
import type { Projection } from "./projection";

export function prepareCanvas(canvas: HTMLCanvasElement, size: Pixel): CanvasRenderingContext2D | undefined {
    const context = canvas.getContext("2d");
    if (!context) return undefined;

    const ratio = window.devicePixelRatio;
    canvas.width = size.x * ratio;
    canvas.height = size.y * ratio;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    return context;
}

export function drawWalks(context: CanvasRenderingContext2D, tracks: Track[], upTo: number, view: ViewLayout, projection: Projection, colours: string[], origin: string): void {
    context.clearRect(0, 0, view.canvas.x, view.canvas.y);
    drawOrigin(context, view, origin);

    tracks.forEach((track, index) => {
        context.strokeStyle = colours[index % colours.length] ?? origin;
        context.beginPath();

        for (let step = 0; step <= upTo; step += 1) {
            const point = toPixel(view, projection.x(track, step), projection.y(track, step));
            if (step === 0) context.moveTo(point.x, point.y);
            else context.lineTo(point.x, point.y);
        }

        context.stroke();
    });
}

function drawOrigin(context: CanvasRenderingContext2D, view: ViewLayout, colour: string): void {
    const centre = toPixel(view, 0, 0);

    context.strokeStyle = colour;
    context.beginPath();
    context.moveTo(centre.x - 5, centre.y);
    context.lineTo(centre.x + 5, centre.y);
    context.moveTo(centre.x, centre.y - 5);
    context.lineTo(centre.x, centre.y + 5);
    context.stroke();
}