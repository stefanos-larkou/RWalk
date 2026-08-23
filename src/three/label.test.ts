import { SpriteMaterial } from "three";
import { describe, expect, it, vi } from "vitest";
import { contexts } from "../test-support";
import { createBin } from "./bin";
import { labelSprite } from "./label";

const COLOUR = "rgba(255, 255, 255, 0.72)";

describe("labelSprite", () => {
    it("writes the number it was given", () => {
        labelSprite(createBin(), "-250", COLOUR);
        expect(contexts.at(-1)?.labels.at(-1)?.text).toBe("-250");
    });

    it("makes a longer number a wider sprite", () => {
        const bin = createBin();
        const one = labelSprite(bin, "1", COLOUR);
        const many = labelSprite(bin, "10000", COLOUR);

        expect(many.scale.x).toBeGreaterThan(one.scale.x);
    });

    it("stands every number the same height", () => {
        const bin = createBin();
        const one = labelSprite(bin, "1", COLOUR);
        const many = labelSprite(bin, "10000", COLOUR);

        expect(many.scale.y).toBe(one.scale.y);
    });

    it("hands its texture and its material to the bin", () => {
        const bin = createBin();
        const material = labelSprite(bin, "1", COLOUR).material as SpriteMaterial;
        const letGo = vi.spyOn(material, "dispose");
        const texture = vi.spyOn(material.map ?? new SpriteMaterial(), "dispose");

        bin.release();

        expect(letGo).toHaveBeenCalled();
        expect(texture).toHaveBeenCalled();
    });
});
