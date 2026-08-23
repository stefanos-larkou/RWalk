import { CanvasTexture, Sprite, SpriteMaterial } from "three";
import type { Bin } from "./bin";

const FONT_PX = 48;
const PADDING = 10;
const FONT = `${FONT_PX}px system-ui, sans-serif`;

export function labelSprite(bin: Bin, text: string, colour: string): Sprite {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (context) {
        context.font = FONT;
        canvas.width = Math.ceil(context.measureText(text).width) + PADDING * 2;
        canvas.height = FONT_PX + PADDING * 2;

        context.font = FONT;
        context.fillStyle = colour;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(text, canvas.width / 2, canvas.height / 2);
    }

    const texture = bin.add(new CanvasTexture(canvas));
    const material = bin.add(new SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    const sprite = new Sprite(material);

    sprite.scale.set(canvas.width / canvas.height, 1, 1);

    return sprite;
}