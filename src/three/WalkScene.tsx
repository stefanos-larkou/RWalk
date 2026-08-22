import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useElementSize } from "@stefanos-larkou/sim-kit";
import { useEffect, useRef } from "react";
import { BufferAttribute, BufferGeometry, Line, LineBasicMaterial, LineSegments, OrthographicCamera, Scene, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Bounds, Track } from "../core/models";
import { originColour, walkerColour } from "../render/palette";
import { type Bin, createBin } from "./bin";
import { radiusOf, centreOf, boxEdgesFor, cubeAround, verticesFor } from "./geometry";

interface WalkSceneProps {
    tracks: Track[];
    bounds: Bounds;
    upTo: number;
}

interface Held {
    renderer: WebGLRenderer;
    scene: Scene;
    camera: OrthographicCamera;
    controls: OrbitControls;
    drawn: Bin;
}

const VIEW_DIRECTION: [number, number, number] = [1, 1.2, 1];

export default function WalkScene({ tracks, bounds, upTo }: WalkSceneProps) {
    const areaRef = useRef<HTMLDivElement>(null);
    const heldRef = useRef<Held | undefined>(undefined);
    const available = useElementSize(areaRef);
    const mode = useTheme().palette.mode;

    useEffect(() => {
        const area = areaRef.current;
        if (!area) return;

        const owned = createBin();
        const renderer = owned.add(new WebGLRenderer({ antialias: true, alpha: true }));
        const scene = new Scene();
        const camera = new OrthographicCamera();
        const controls = owned.add(new OrbitControls(camera, renderer.domElement));
        const drawn = createBin();

        camera.position.set(...VIEW_DIRECTION);
        controls.enablePan = false;
        controls.addEventListener("change", () => renderer.render(scene, camera));
        area.appendChild(renderer.domElement);
        heldRef.current = { renderer, scene, camera, controls, drawn };

        return () => {
            drawn.release();
            owned.release();
            area.removeChild(renderer.domElement);
            heldRef.current = undefined;
        };
    }, []);

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
        held.scene.clear();

        const frame = new BufferGeometry();
        frame.setAttribute("position", new BufferAttribute(boxEdgesFor(cubeAround(bounds)), 3));
        held.scene.add(new LineSegments(
            held.drawn.add(frame),
            held.drawn.add(new LineBasicMaterial({ color: originColour(mode) }))
        ));

        tracks.forEach((track, index) => {
            const path = new BufferGeometry();
            path.setAttribute("position", new BufferAttribute(verticesFor(track, upTo), 3));
            held.scene.add(new Line(
                held.drawn.add(path),
                held.drawn.add(new LineBasicMaterial({ color: walkerColour(index, mode) }))
            ));
        });

        held.renderer.render(held.scene, held.camera);
    }, [tracks, upTo, bounds, mode]);

    return <Box ref={areaRef} sx={{ flex: 1, minHeight: 0, minWidth: 0, "& canvas": { display: "block" } }} />;
}