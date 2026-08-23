import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useElementSize } from "@stefanos-larkou/sim-kit";
import { useEffect, useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, Group, Line, LineBasicMaterial, LineSegments, OrthographicCamera, Scene, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Bounds, Track } from "../core/models";
import { MIN_ZOOM } from "../render/layout";
import { FRAME_OPACITY, GRID_OPACITY, frameColour, labelColour, walkerColour } from "../render/palette";
import { type Bin, createBin } from "./bin";
import { edgeTicksFor, labelsFor, paneGridFor } from "./axes";
import { labelSprite } from "./label";
import { radiusOf, centreOf, boxEdgesFor, cubeAround, verticesFor } from "./geometry";

interface WalkSceneProps {
    tracks: Track[];
    bounds: Bounds;
    upTo: number;
    stableLimits: boolean;
}

interface Held {
    renderer: WebGLRenderer;
    scene: Scene;
    camera: OrthographicCamera;
    controls: OrbitControls;
    plot: Group;
    marks: Group;
    drawn: Bin;
    lettered: Bin;
}

const VIEW_DIRECTION: [number, number, number] = [1, 1.2, 1];
const TARGET_TICKS = 5;
const TICK_SHARE = 90;
const LABEL_SHARE = 22;
const LABEL_GAP_SHARE = 26;

function joined(parts: Float32Array[]): Float32Array {
    const whole = new Float32Array(parts.reduce((total, part) => total + part.length, 0));
    parts.reduce((at, part) => {
        whole.set(part, at);
        return at + part.length;
    }, 0);

    return whole;
}

export default function WalkScene({ tracks, bounds, upTo, stableLimits }: WalkSceneProps) {
    const areaRef = useRef<HTMLDivElement>(null);
    const heldRef = useRef<Held | undefined>(undefined);
    const available = useElementSize(areaRef);
    const mode = useTheme().palette.mode;

    const cube = useMemo(() => cubeAround(bounds), [bounds]);
    const height = radiusOf(cube) / LABEL_SHARE;
    const labels = useMemo(() => labelsFor(cube, TARGET_TICKS, radiusOf(cube) / LABEL_GAP_SHARE), [cube]);

    const signature = labels.map(label => label.value).join(",");
    const values = useMemo(() => signature.split(",").filter(Boolean), [signature]);

    useEffect(() => {
        const area = areaRef.current;
        if (!area) return;

        const owned = createBin();
        const renderer = owned.add(new WebGLRenderer({ antialias: true, alpha: true }));
        const scene = new Scene();
        const camera = new OrthographicCamera();
        const controls = owned.add(new OrbitControls(camera, renderer.domElement));
        const drawn = createBin();
        const lettered = createBin();
        const plot = new Group();
        const marks = new Group();

        scene.add(plot);
        scene.add(marks);

        camera.position.set(...VIEW_DIRECTION);
        controls.enablePan = false;
        controls.minZoom = MIN_ZOOM;
        controls.cursorStyle = "grab";
        controls.addEventListener("change", () => renderer.render(scene, camera));
        area.appendChild(renderer.domElement);
        heldRef.current = { renderer, scene, camera, controls, plot, marks, drawn, lettered };

        return () => {
            drawn.release();
            lettered.release();
            owned.release();
            area.removeChild(renderer.domElement);
            heldRef.current = undefined;
        };
    }, []);

    useEffect(() => {
        const held = heldRef.current;
        if (!held) return;

        held.camera.zoom = MIN_ZOOM;
        held.camera.updateProjectionMatrix();
        held.renderer.render(held.scene, held.camera);
    }, [tracks, stableLimits]);

    useEffect(() => {
        const held = heldRef.current;
        if (!held || available.x === 0 || available.y === 0) return;

        const radius = radiusOf(cubeAround(bounds));
        const aspect = available.x / available.y;

        held.camera.left = -radius * Math.max(aspect, 1);
        held.camera.right = radius * Math.max(aspect, 1);
        held.camera.top = radius * Math.max(1 / aspect, 1);
        held.camera.bottom = -radius * Math.max(1 / aspect, 1);
        held.camera.near = -radius * 10;
        held.camera.far = radius * 10;
        held.camera.updateProjectionMatrix();

        const centre = new Vector3(...centreOf(bounds));

        held.camera.position.add(centre).sub(held.controls.target);
        held.controls.target.copy(centre);
        held.controls.update();

        held.renderer.setPixelRatio(window.devicePixelRatio);
        held.renderer.setSize(available.x, available.y);
        held.renderer.render(held.scene, held.camera);
    }, [available, bounds]);

    useEffect(() => {
        const held = heldRef.current;
        if (!held) return;

        held.drawn.release();
        held.plot.clear();

        const cube = cubeAround(bounds);
        const frame = new BufferGeometry();
        frame.setAttribute("position", new BufferAttribute(joined([
            boxEdgesFor(cube),
            edgeTicksFor(cube, TARGET_TICKS, radiusOf(cube) / TICK_SHARE)
        ]), 3));
        held.plot.add(new LineSegments(
            held.drawn.add(frame),
            held.drawn.add(new LineBasicMaterial({ color: frameColour(mode), transparent: true, opacity: FRAME_OPACITY }))
        ));

        const grid = new BufferGeometry();
        grid.setAttribute("position", new BufferAttribute(paneGridFor(cube, TARGET_TICKS), 3));
        held.plot.add(new LineSegments(
            held.drawn.add(grid),
            held.drawn.add(new LineBasicMaterial({ color: frameColour(mode), transparent: true, opacity: GRID_OPACITY }))
        ));

        tracks.forEach((track, index) => {
            const path = new BufferGeometry();
            path.setAttribute("position", new BufferAttribute(verticesFor(track, upTo), 3));
            held.plot.add(new Line(
                held.drawn.add(path),
                held.drawn.add(new LineBasicMaterial({ color: walkerColour(index, mode) }))
            ));
        });

        held.renderer.render(held.scene, held.camera);
    }, [tracks, upTo, bounds, mode]);

    useEffect(() => {
        const held = heldRef.current;
        if (!held) return;

        held.lettered.release();
        held.marks.clear();
        held.marks.add(...values.map(value => labelSprite(held.lettered, value, labelColour(mode))));
        held.renderer.render(held.scene, held.camera);
    }, [values, mode]);

    useEffect(() => {
        const held = heldRef.current;
        if (!held) return;

        held.marks.children.forEach((mark, index) => {
            const label = labels[index];
            if (!label) return;

            const aspect = mark.scale.x / mark.scale.y;
            mark.scale.set(height * aspect, height, 1);

            const half = label.out[0] === 0 ? mark.scale.y / 2 : mark.scale.x / 2;
            mark.position.set(...label.at.map((coord, axis) => coord + (label.out[axis] ?? 0) * half) as [number, number, number]);
        });

        held.renderer.render(held.scene, held.camera);
    }, [labels, height]);

    return <Box ref={areaRef} sx={{ flex: 1, minHeight: 0, minWidth: 0, "& canvas": { display: "block" } }} />;
}