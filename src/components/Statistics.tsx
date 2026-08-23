import { Box, Grow, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useDeferredValue, useMemo } from "react";
import { displacementConfig, distributionConfig, returnsConfig } from "../charts/configs";
import { Plot } from "../charts/Plot";
import { HISTOGRAM_BINS } from "../core/constants";
import { expectedDensity, expectedSquared, histogram, meanSquared, measure, returnCeiling, returnedBy } from "../core/statistics";

const CHART_HEIGHT = "min(68vh, 560px)";

const ENTRANCE = 450;
const STAGGER = 200;

interface StatisticsProps {
    dimensions: number;
    steps: number;
    diagonals: boolean;
    seed: number;
    samples: number;
}

export function Statistics({ dimensions, steps, diagonals, seed, samples }: StatisticsProps) {
    const mode = useTheme().palette.mode;

    const measuring = useDeferredValue(samples);
    const busy = measuring !== samples;

    const ensemble = useMemo(
        () => measure({ dimensions, steps, diagonals }, measuring, seed),
        [dimensions, steps, diagonals, measuring, seed]
    );
    const bars = useMemo(() => histogram(ensemble.distances, HISTOGRAM_BINS), [ensemble]);

    const displacement = useMemo(
        () => displacementConfig(meanSquared(ensemble), expectedSquared(dimensions, diagonals, steps), mode),
        [ensemble, dimensions, diagonals, steps, mode]
    );
    const distribution = useMemo(
        () => distributionConfig(bars, expectedDensity(dimensions, diagonals, steps, bars.centres), mode),
        [bars, dimensions, diagonals, steps, mode]
    );
    const returns = useMemo(
        () => returnsConfig(returnedBy(ensemble), returnCeiling(dimensions, diagonals), mode),
        [ensemble, dimensions, diagonals, mode]
    );

    return (
        <Stack
            spacing={4}
            sx={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                overflowY: "auto",
                pt: 2,
                pr: 1,
                opacity: busy ? 0.45 : 1,
                transition: "opacity 150ms"
            }}
        >
            {[displacement, distribution, returns].map((config, index) => (
                <Grow key={index} in timeout={ENTRANCE + index * STAGGER} style={{ transformOrigin: "top center" }}>
                    <Box sx={{ flex: "0 0 auto", height: CHART_HEIGHT }}>
                        <Plot config={config} />
                    </Box>
                </Grow>
            ))}
        </Stack>
    );
}