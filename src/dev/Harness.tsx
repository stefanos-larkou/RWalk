import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { Box, CssBaseline, IconButton, ThemeProvider, createTheme } from "@mui/material";
import { useMemo, useState } from "react";
import { RWalk } from "../components/RWalk";

export function Harness() {
    const [mode, setMode] = useState<"light" | "dark">("dark");
    const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
                <Box sx={{ alignSelf: "flex-end", p: 1 }}>
                    <IconButton
                        onClick={() => setMode(current => current === "dark" ? "light" : "dark")}
                        aria-label="Toggle theme"
                    >
                        {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                </Box>
                <RWalk />
            </Box>
        </ThemeProvider>
    );
}