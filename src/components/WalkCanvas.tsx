import { Box } from "@mui/material";
import { useElementSize, useThemeMode, withinRange } from "@stefanos-larkou/sim-kit";
import type { Pixel } from "@stefanos-larkou/sim-kit";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { Bounds, Track } from "../core/models";
import { apartness } from "../core/touch";
import { drawAxes } from "../render/axes";
import { clearCanvas, drawWalks, prepareCanvas } from "../render/draw";
import { INSET, MAX_ZOOM, MIN_ZOOM, NO_INSET, clampPan, layoutFor, visibleBox, worldBox, zoomed } from "../render/layout";
import { axisColour, gridColour, walkerColour } from "../render/palette";
import { projectionFor } from "../render/projection";

const WHEEL_SHARE = 0.002;
const CENTRED: Pixel = { x: 0, y: 0 };

interface WalkCanvasProps {
    tracks: Track[];
    bounds: Bounds;
    span: number;
    upTo: number;
    stableLimits: boolean;
    bare?: boolean;
}

export function WalkCanvas({ tracks, bounds, span, upTo, stableLimits, bare = false }: WalkCanvasProps) {
    const areaRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const contextRef = useRef<CanvasRenderingContext2D | undefined>(undefined);
    const available = useElementSize(areaRef);
    const mode = useThemeMode();
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const [offset, setOffset] = useState<Pixel>(CENTRED);
    const [dragging, setDragging] = useState(false);
    const [shownFor, setShownFor] = useState({ tracks, stableLimits });
    const fromRef = useRef<{ at: Pixel; offset: Pixel; } | undefined>(undefined);
    const touchesRef = useRef(new Map<number, Pixel>());
    const pinchRef = useRef<{ apart: number; zoom: number; } | undefined>(undefined);

    if (shownFor.tracks !== tracks || shownFor.stableLimits !== stableLimits) {
        setShownFor({ tracks, stableLimits });
        setZoom(MIN_ZOOM);
        setOffset(CENTRED);
    }

    const dimensions = tracks[0]?.dimensions ?? 1;
    const box = useMemo(() => worldBox(bounds, span, dimensions), [bounds, span, dimensions]);
    const fitted = useMemo(() => layoutFor(box, available, dimensions > 1, bare ? NO_INSET : INSET), [box, available, dimensions, bare]);
    const view = useMemo(() => zoomed(fitted, zoom, clampPan(fitted, zoom, offset)), [fitted, zoom, offset]);
    const shown = useMemo(() => visibleBox(view), [view]);
    const projection = useMemo(() => projectionFor(dimensions), [dimensions]);
    const colours = useMemo(
        () => tracks.map((_track, index) => walkerColour(index, mode)),
        [tracks, mode]
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        contextRef.current = prepareCanvas(canvas, view.canvas);
    }, [view]);

    useEffect(() => {
        const area = areaRef.current;
        if (!area || bare) return;

        const onWheel = (event: WheelEvent) => {
            event.preventDefault();
            setZoom(current => withinRange(current * Math.exp(-event.deltaY * WHEEL_SHARE), MIN_ZOOM, MAX_ZOOM));
        };

        area.addEventListener("wheel", onWheel, { passive: false });

        return () => area.removeEventListener("wheel", onWheel);
    }, [bare]);

    const grab = (event: PointerEvent<HTMLDivElement>) => {
        if (bare) return;

        touchesRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (touchesRef.current.size === 2) {
            pinchRef.current = { apart: apartness(touchesRef.current), zoom };
            fromRef.current = undefined;
            setDragging(false);
            return;
        }

        if (zoom === MIN_ZOOM) return;

        event.currentTarget.setPointerCapture(event.pointerId);
        fromRef.current = { at: { x: event.clientX, y: event.clientY }, offset };
        setDragging(true);
    };

    const drag = (event: PointerEvent<HTMLDivElement>) => {
        const touches = touchesRef.current;
        if (touches.has(event.pointerId)) touches.set(event.pointerId, { x: event.clientX, y: event.clientY });

        const pinch = pinchRef.current;
        if (pinch && touches.size >= 2) {
            const apart = apartness(touches);
            if (apart > 0) setZoom(withinRange(pinch.zoom * apart / pinch.apart, MIN_ZOOM, MAX_ZOOM));
            return;
        }

        const from = fromRef.current;
        if (!from) return;

        setOffset(clampPan(fitted, zoom, {
            x: from.offset.x + event.clientX - from.at.x,
            y: from.offset.y + event.clientY - from.at.y
        }));
    };

    const release = (event: PointerEvent<HTMLDivElement>) => {
        touchesRef.current.delete(event.pointerId);
        if (touchesRef.current.size < 2) pinchRef.current = undefined;

        if (!fromRef.current) return;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        fromRef.current = undefined;
        setDragging(false);
    };

    useEffect(() => {
        const context = contextRef.current;
        if (!context) return;

        clearCanvas(context, view);
        if (!bare) drawAxes(context, view, shown, { grid: gridColour(mode), axis: axisColour(mode) });
        drawWalks(context, tracks, upTo, view, projection, colours);
    }, [tracks, upTo, view, shown, projection, colours, mode, bare]);

    return (
        <Box
            ref={areaRef}
            onPointerDown={grab}
            onPointerMove={drag}
            onPointerUp={release}
            onPointerCancel={release}
            sx={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                touchAction: bare ? "auto" : "none",
                cursor: bare || zoom === MIN_ZOOM ? "default" : (dragging ? "grabbing" : "grab")
            }}
        >
            <Box component="canvas" ref={canvasRef} sx={{ display: "block" }} />
        </Box>
    );
}