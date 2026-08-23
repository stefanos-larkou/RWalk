import type { Box, ViewLayout } from "../core/models";
import { tickStep, ticksBetween } from "../core/ticks";
import { INSET, toPixel } from "./layout";

export interface AxisPalette {
    grid: string;
    axis: string;
}

const TARGET_TICKS = 5;
const LABEL_FONT = "15px system-ui, sans-serif";
const LABEL_GAP = 6;

export function drawAxes(context: CanvasRenderingContext2D, view: ViewLayout, box: Box, palette: AxisPalette): void {
    const left = INSET.left;
    const right = Math.max(view.canvas.x - INSET.right, left);
    const top = INSET.top;
    const bottom = Math.max(view.canvas.y - INSET.bottom, top);

    context.lineWidth = 1;
    context.font = LABEL_FONT;
    context.fillStyle = palette.axis;

    context.textAlign = "center";
    context.textBaseline = "top";
    ticksBetween(box.minX, box.maxX, tickStep(box.maxX - box.minX, TARGET_TICKS)).forEach(value => {
        const at = toPixel(view, value, 0).x;

        rule(context, at, top, at, bottom, value === 0 ? palette.axis : palette.grid);
        context.fillText(`${value}`, at, bottom + LABEL_GAP);
    });

    context.textAlign = "right";
    context.textBaseline = "middle";
    ticksBetween(box.minY, box.maxY, tickStep(box.maxY - box.minY, TARGET_TICKS)).forEach(value => {
        const at = toPixel(view, 0, value).y;

        rule(context, left, at, right, at, value === 0 ? palette.axis : palette.grid);
        context.fillText(`${value}`, left - LABEL_GAP, at);
    });
}

function rule(context: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, colour: string): void {
    context.strokeStyle = colour;
    context.beginPath();
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    context.stroke();
}