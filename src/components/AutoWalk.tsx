import { Box } from "@mui/material";
import { lastIndex, usePlayback } from "@stefanos-larkou/sim-kit";
import { lazy, Suspense, useEffect, useRef } from "react";
import { MAX_DIMENSIONS } from "../core/constants";
import { useWalkScene } from "../hooks/useWalkScene";
import { WalkCanvas } from "./WalkCanvas";

const WalkScene = lazy(() => import("../three/WalkScene"));

export interface AutoWalkProps {
    seed: number;
    dimensions: number;
    walkers: number;
    steps: number;
    speed: number;
    diagonals?: boolean;
    onFinished?: () => void;
}

export function AutoWalk({ seed, dimensions, walkers, steps, speed, diagonals = false, onFinished }: AutoWalkProps) {
    const reported = useRef(false);
    const playback = usePlayback(steps + 1, speed, true);
    const upTo = Math.floor(playback.index);
    const scene = useWalkScene({ dimensions, walkers, steps, diagonals, seed, stableLimits: true, upTo });
    const finished = playback.index >= lastIndex(steps + 1);

    useEffect(() => {
        if (!finished || reported.current) return;

        reported.current = true;
        onFinished?.();
    }, [finished, onFinished]);

    return (
        <Box sx={{ display: "flex", width: "100%", height: "100%", overflow: "hidden" }}>
            {dimensions === MAX_DIMENSIONS
                ? (
                    <Suspense fallback={null}>
                        <WalkScene tracks={scene.tracks} bounds={scene.bounds} upTo={upTo} stableLimits bare />
                    </Suspense>
                )
                : <WalkCanvas tracks={scene.tracks} bounds={scene.bounds} span={scene.span} upTo={upTo} stableLimits bare />}
        </Box>
    );
}
