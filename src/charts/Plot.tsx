import { Box } from "@mui/material";
import { Chart } from "chart.js";
import type { ChartConfiguration } from "chart.js";
import { useEffect, useRef } from "react";
import "./register";

interface PlotProps {
    config: ChartConfiguration<"line">;
}

export function Plot({ config }: PlotProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartRef = useRef<Chart<"line"> | undefined>(undefined);
    const drawn = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const chart = new Chart(canvas, { type: "line", data: { datasets: [] } });
        chartRef.current = chart;

        return () => {
            chart.destroy();
            chartRef.current = undefined;
        };
    }, []);

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;

        chart.data = config.data;
        chart.options = config.options ?? {};

        chart.update(drawn.current ? "none" : undefined);
        drawn.current = true;
    }, [config]);

    return (
        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
            <Box component="canvas" ref={canvasRef} />
        </Box>
    );
}
