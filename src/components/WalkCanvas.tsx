import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useElementSize } from "@stefanos-larkou/sim-kit";
import { useEffect, useMemo, useRef } from "react";
import type { Bounds, Track } from "../core/models";
import { drawAxes } from "../render/axes";
import { clearCanvas, drawWalks, prepareCanvas } from "../render/draw";
import { layoutFor, worldBox } from "../render/layout";
import { axisColour, gridColour, walkerColour } from "../render/palette";
import { projectionFor } from "../render/projection";

interface WalkCanvasProps {
    tracks: Track[];
    bounds: Bounds;
    span: number;
    upTo: number;
}

export function WalkCanvas({ tracks, bounds, span, upTo }: WalkCanvasProps) {
    const areaRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const contextRef = useRef<CanvasRenderingContext2D | undefined>(undefined);
    const available = useElementSize(areaRef);
    const mode = useTheme().palette.mode;

    const dimensions = tracks[0]?.dimensions ?? 1;
    const box = useMemo(() => worldBox(bounds, span, dimensions), [bounds, span, dimensions]);
    const view = useMemo(() => layoutFor(box, available, dimensions > 1), [box, available, dimensions]);
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
        const context = contextRef.current;
        if (!context) return;

        clearCanvas(context, view);
        drawAxes(context, view, box, { grid: gridColour(mode), axis: axisColour(mode) });
        drawWalks(context, tracks, upTo, view, projection, colours);
    }, [tracks, upTo, view, box, projection, colours, mode]);

    return (
        <Box ref={areaRef} sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
            <Box component="canvas" ref={canvasRef} sx={{ display: "block" }} />
        </Box>
    );
}