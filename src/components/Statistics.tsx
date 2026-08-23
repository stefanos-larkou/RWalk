import { Box, Grow, Paper } from "@mui/material";
import { useThemeMode } from "@stefanos-larkou/sim-kit";
import { useDeferredValue, useMemo } from "react";
import { displacementConfig, distributionConfig, returnsConfig } from "../charts/configs";
import { Plot } from "../charts/Plot";
import { HISTOGRAM_BINS } from "../core/constants";
import { expectedDensity, expectedSquared, histogram, meanSquared, measure, returnCeiling, returnedBy } from "../core/statistics";

const CHART_HEIGHT = "min(46vh, 440px)";
const WIDEST = 2;

const ENTRANCE = 450;
const STAGGER = 200;

interface StatisticsProps {
    dimensions: number;
    steps: number;
    diagonals: boolean;
    seed: number;
    samples: number;
}

export default function Statistics({ dimensions, steps, diagonals, seed, samples }: StatisticsProps) {
    const mode = useThemeMode();

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
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                overflowY: "auto",
                display: "grid",
                gap: 2,
                pt: 1,
                pr: 1,
                gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "repeat(2, minmax(0, 1fr))" },
                opacity: busy ? 0.45 : 1,
                transition: "opacity 150ms"
            }}
        >
            {[displacement, returns, distribution].map((config, index) => (
                <Grow key={index} in timeout={ENTRANCE + index * STAGGER} style={{ transformOrigin: "top center" }}>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            height: CHART_HEIGHT,
                            borderRadius: 2,
                            boxSizing: "border-box",
                            gridColumn: { lg: index === WIDEST ? "span 2" : "auto" }
                        }}
                    >
                        <Plot config={config} />
                    </Paper>
                </Grow>
            ))}
        </Box>
    );
}