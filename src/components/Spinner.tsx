import { Box } from "@mui/material";

const SIZE = 76;
const THICKNESS = 5;
const TURN = 900;

const SPIN = { to: { transform: "rotate(360deg)" } };

const APPEAR = { to: { opacity: 1 } };
const PATIENCE = 250;
const FADE = 200;

interface SpinnerProps {
    label: string;
}

export function Spinner({ label }: SpinnerProps) {
    return (
        <Box
            sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                animation: `appear ${FADE}ms linear ${PATIENCE}ms forwards`,
                "@keyframes appear": APPEAR
            }}
        >
            <Box
                role="progressbar"
                aria-label={label}
                sx={{
                    width: SIZE,
                    height: SIZE,
                    borderRadius: "50%",
                    border: `${THICKNESS}px solid`,
                    borderColor: "divider",
                    borderTopColor: "primary.main",
                    animation: `spin ${TURN}ms linear infinite`,
                    "@keyframes spin": SPIN
                }}
            />
        </Box>
    );
}
