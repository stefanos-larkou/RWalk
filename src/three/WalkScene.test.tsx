import { ThemeProvider, createTheme } from "@mui/material";
import { render } from "@testing-library/react";
import type { OrthographicCamera } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { boundsFor } from "../core/bounds";
import type { WalkOptions } from "../core/models";
import { walksFor } from "../core/walk";
import { MIN_ZOOM } from "../render/layout";
import WalkScene from "./WalkScene";

interface Renderer {
    disposed: number;
}

interface Controls {
    camera: OrthographicCamera;
    enabled: boolean;
    enablePan: boolean;
    minZoom: number;
    disposed: number;
}

const renderers = vi.hoisted(() => [] as Renderer[]);
const controls = vi.hoisted(() => [] as Controls[]);

vi.mock("three", async importOriginal => {
    const actual = await importOriginal<typeof import("three")>();

    class FakeRenderer {
        readonly domElement = document.createElement("canvas");
        disposed = 0;

        constructor() {
            renderers.push(this);
        }

        setPixelRatio() { }
        setSize() { }
        render() { }

        dispose() {
            this.disposed += 1;
        }
    }

    return { ...actual, WebGLRenderer: FakeRenderer };
});

vi.mock("three/examples/jsm/controls/OrbitControls.js", async () => {
    const { Vector3 } = await import("three");

    class FakeControls {
        readonly target = new Vector3();
        readonly camera: OrthographicCamera;
        enabled = true;
        enablePan = true;
        minZoom = 0;
        cursorStyle = "";
        disposed = 0;

        constructor(camera: OrthographicCamera) {
            this.camera = camera;
            controls.push(this as unknown as Controls);
        }

        addEventListener() { }
        update() { }

        dispose() {
            this.disposed += 1;
        }
    }

    return { OrbitControls: FakeControls };
});

const OPTIONS: WalkOptions = { dimensions: 3, steps: 20, diagonals: false };

function walkScene(stableLimits = true, tracks = walksFor(OPTIONS, 2, 1), bare = false) {
    const bounds = boundsFor(tracks).at(-1) ?? { min: [0, 0, 0], max: [0, 0, 0] };

    return (
        <ThemeProvider theme={createTheme()}>
            <WalkScene tracks={tracks} bounds={bounds} upTo={20} stableLimits={stableLimits} bare={bare} />
        </ThemeProvider>
    );
}

function only<T>(held: T[]): T {
    expect(held).toHaveLength(1);
    return held[0] as T;
}

describe("WalkScene", () => {
    beforeEach(() => {
        renderers.length = 0;
        controls.length = 0;
    });

    it("puts a canvas on the page", () => {
        const { container } = render(walkScene());
        expect(container.querySelector("canvas")).toBeInTheDocument();
    });

    it("opens as far out as it goes and lets the walk no further away", () => {
        render(walkScene());
        expect(only(controls).minZoom).toBe(MIN_ZOOM);
        expect(only(controls).camera.zoom).toBe(MIN_ZOOM);
    });

    it("turns the walk rather than sliding it", () => {
        render(walkScene());
        expect(only(controls).enablePan).toBe(false);
    });

    it("opens a walk it has not seen before as far out as it goes", () => {
        const { rerender } = render(walkScene());
        const camera = only(controls).camera;
        camera.zoom = 6;

        rerender(walkScene());

        expect(camera.zoom).toBe(MIN_ZOOM);
    });

    it("opens fully out again when the walk is framed differently", () => {
        const tracks = walksFor(OPTIONS, 2, 1);
        const { rerender } = render(walkScene(true, tracks));
        const camera = only(controls).camera;
        camera.zoom = 6;

        rerender(walkScene(false, tracks));

        expect(camera.zoom).toBe(MIN_ZOOM);
    });

    it("keeps the zoom while only the playback moves", () => {
        const tracks = walksFor(OPTIONS, 2, 1);
        const { rerender } = render(walkScene(true, tracks));
        const camera = only(controls).camera;
        camera.zoom = 6;

        rerender(walkScene(true, tracks));

        expect(camera.zoom).toBe(6);
    });

    it("answers the pointer when it is there to be used", () => {
        render(walkScene());
        expect(only(controls).enabled).toBe(true);
    });

    it("ignores the pointer when it is only decoration", () => {
        render(walkScene(true, walksFor(OPTIONS, 2, 1), true));
        expect(only(controls).enabled).toBe(false);
    });

    it("gives back the context it took when it goes", () => {
        const { unmount } = render(walkScene());
        const renderer = only(renderers);

        unmount();

        expect(renderer.disposed).toBe(1);
    });
});
