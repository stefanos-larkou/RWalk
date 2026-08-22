import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useElementSize } from "@stefanos-larkou/sim-kit";
import { useEffect, useMemo, useRef } from "react";
import type { Bounds, Track } from "../core/models";
import { drawWalks, prepareCanvas } from "../render/draw";
import { layoutFor, worldBox } from "../render/layout";
import { originColour, walkerColour } from "../render/palette";
import { projectionFor } from "../render/projection";

interface WalkCanvasProps {
    tracks: Track[];
    bounds: Bounds;
    steps: number;
    upTo: number;
}

export function WalkCanvas({ tracks, bounds, steps, upTo }: WalkCanvasProps) {
    const areaRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const contextRef = useRef<CanvasRenderingContext2D | undefined>(undefined);
    const available = useElementSize(areaRef);
    const mode = useTheme().palette.mode;

    const dimensions = tracks[0]?.dimensions ?? 1;
    const view = useMemo(
        () => layoutFor(worldBox(bounds, steps, dimensions), available, dimensions > 1),
        [bounds, steps, dimensions, available]
    );
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
        drawWalks(context, tracks, upTo, view, projection, colours, originColour(mode));
    }, [tracks, upTo, view, projection, colours, mode]);

    return (
        <Box ref={areaRef} sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
            <Box component="canvas" ref={canvasRef} sx={{ display: "block" }} />
        </Box>
    );
}