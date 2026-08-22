import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import { Box, FormControlLabel, IconButton, Slider, Stack, Switch, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import { ControlSlider, EMPTY_INDEX, NumberField, lastIndex, usePersistedFlag, usePersistedNumber, usePlayback } from "@stefanos-larkou/sim-kit";
import { useMemo } from "react";
import { CONTROLS_WIDTH, DEFAULT_DIMENSIONS, DEFAULT_SEED, DEFAULT_SPEED_SLIDER, DEFAULT_STEPS, DEFAULT_STEP_SIZE, DEFAULT_WALKERS, MAX_DIMENSIONS, MAX_SEED, MAX_STEPS, MAX_STEP_SIZE, MAX_WALKERS, MIN_DIMENSIONS, MIN_SEED, MIN_STEPS, MIN_STEP_SIZE, MIN_WALKERS, SLIDER_MAX, SLIDER_MIN, TRANSPORT_BUTTONS_WIDTH } from "../core/constants";
import { stepCounter } from "../core/counter";
import { speedFrom } from "../core/scales";
import { DIAGONALS_KEY, DIMENSIONS_KEY, SEED_KEY, SPEED_KEY, STABLE_LIMITS_KEY, STEPS_KEY, STEP_SIZE_KEY, WALKERS_KEY } from "../core/storage";
import { useWalkScene } from "../hooks/useWalkScene";
import { WalkCanvas } from "./WalkCanvas";

const LABELS = {
    dimensions: "Dimensions",
    walkers: "Walkers",
    steps: "Steps",
    speed: "Speed",
    seed: "Seed",
    diagonals: "Diagonal moves",
    stableLimits: "Stable limits",
    progress: "Walk progress",
    play: "Play",
    pause: "Pause",
    replay: "Start again",
    stepSize: "Step size"
};

const HINTS = {
    diagonals: "Let a step move along more than one axis at once",
    diagonalsFlat: "In one dimension there is nothing for diagonals to change",
    stableLimits: "Keep the view fixed to where the whole walk will reach",
    counter: "How many steps of the walk are drawn"
};

const NO_SLIDER_EASING = { "& .MuiSlider-thumb, & .MuiSlider-track": { transition: "none" } };

export function RWalk() {
    const [dimensions, setDimensions] = usePersistedNumber(DIMENSIONS_KEY, DEFAULT_DIMENSIONS, MIN_DIMENSIONS, MAX_DIMENSIONS);
    const [walkers, setWalkers] = usePersistedNumber(WALKERS_KEY, DEFAULT_WALKERS, MIN_WALKERS, MAX_WALKERS);
    const [steps, setSteps] = usePersistedNumber(STEPS_KEY, DEFAULT_STEPS, MIN_STEPS, MAX_STEPS);
    const [seed, setSeed] = usePersistedNumber(SEED_KEY, DEFAULT_SEED, MIN_SEED, MAX_SEED);
    const [speedSlider, setSpeedSlider] = usePersistedNumber(SPEED_KEY, DEFAULT_SPEED_SLIDER, SLIDER_MIN, SLIDER_MAX);
    const [stepSize, setStepSize] = usePersistedNumber(STEP_SIZE_KEY, DEFAULT_STEP_SIZE, MIN_STEP_SIZE, MAX_STEP_SIZE);
    const [diagonals, setDiagonals] = usePersistedFlag(DIAGONALS_KEY, false);
    const [stableLimits, setStableLimits] = usePersistedFlag(STABLE_LIMITS_KEY, true);

    const speed = useMemo(() => speedFrom(speedSlider), [speedSlider]);
    const playback = usePlayback(steps + 1, speed);
    const upTo = Math.floor(playback.index);
    const flat = dimensions === MIN_DIMENSIONS;
    const scene = useWalkScene({ dimensions, walkers, steps, diagonals, seed, stableLimits, upTo });

    return (
        <Box
            sx={{
                display: "grid",
                gap: 2,
                p: 2,
                flex: 1,
                width: "100%",
                boxSizing: "border-box",
                gridTemplateColumns: { xs: "minmax(0, 1fr)", md: `${CONTROLS_WIDTH}px minmax(0, 1fr)` },
                gridTemplateRows: { xs: "auto auto auto", md: "minmax(0, 1fr) auto" },
                gridTemplateAreas: {
                    xs: "\"params\" \"walk\" \"transport\"",
                    md: "\"params walk\" \"params transport\""
                }
            }}
        >
            <Stack spacing={2} sx={{ gridArea: "params", width: "100%", alignSelf: "center" }}>
                <Stack spacing={1}>
                    <Typography variant="body1" color="text.secondary">{LABELS.dimensions}</Typography>
                    <ToggleButtonGroup
                        exclusive
                        fullWidth
                        value={String(dimensions)}
                        onChange={(_event, next) => next && setDimensions(Number(next))}
                        aria-label={LABELS.dimensions}
                    >
                        <ToggleButton value="1">1D</ToggleButton>
                        <ToggleButton value="2">2D</ToggleButton>
                        <ToggleButton value="3">3D</ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                <ControlSlider label={LABELS.speed} value={speedSlider} min={SLIDER_MIN} max={SLIDER_MAX} onChange={setSpeedSlider} />
                <ControlSlider label={LABELS.walkers} value={walkers} min={MIN_WALKERS} max={MAX_WALKERS} onChange={setWalkers} />
                <ControlSlider label={LABELS.steps} value={steps} min={MIN_STEPS} max={MAX_STEPS} onChange={setSteps} />

                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Typography variant="body1" color="text.secondary" sx={{ width: 96 }}>{LABELS.seed}</Typography>
                    <NumberField label={LABELS.seed} value={seed} min={MIN_SEED} max={MAX_SEED} onChange={setSeed} />
                </Stack>

                <Tooltip describeChild title={flat ? HINTS.diagonalsFlat : HINTS.diagonals} placement="top">
                    <Box sx={{ alignSelf: "center" }}>
                        <FormControlLabel
                            control={<Switch checked={diagonals && !flat} disabled={flat} onChange={event => setDiagonals(event.target.checked)} />}
                            label={LABELS.diagonals}
                            labelPlacement="start"
                            sx={{ mx: 0 }}
                        />
                    </Box>
                </Tooltip>
                <Tooltip describeChild title={HINTS.stableLimits} placement="top">
                    <FormControlLabel
                        control={<Switch checked={stableLimits} onChange={event => setStableLimits(event.target.checked)} />}
                        label={LABELS.stableLimits}
                        labelPlacement="start"
                        sx={{ alignSelf: "center", mx: 0 }}
                    />
                </Tooltip>
            </Stack>

            <Box sx={{ gridArea: "walk", display: "flex", minHeight: 0, minWidth: 0 }}>
                <WalkCanvas tracks={scene.tracks} bounds={scene.bounds} steps={steps} upTo={upTo} />
            </Box>

            <Box sx={{ gridArea: "transport", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, width: "100%", minWidth: 0 }}>
                <Box sx={{ width: "100%", px: 1.5, boxSizing: "border-box" }}>
                    <Slider
                        value={playback.index}
                        min={EMPTY_INDEX}
                        max={lastIndex(steps + 1)}
                        step={0.01}
                        onChange={(_event, value) => playback.scrubTo(value)}
                        aria-label={LABELS.progress}
                        getAriaValueText={value => stepCounter(value, steps)}
                        sx={NO_SLIDER_EASING}
                    />
                </Box>

                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
                    <Tooltip title={`Back ${stepSize}`} placement="top">
                        <IconButton onClick={() => playback.step(-stepSize)} aria-label={`Back ${stepSize}`}>
                            <SkipPreviousIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={playback.playing ? LABELS.pause : LABELS.play} placement="top">
                        <IconButton onClick={playback.toggle} aria-label={playback.playing ? LABELS.pause : LABELS.play}>
                            {playback.playing ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={`Forward ${stepSize}`} placement="top">
                        <IconButton onClick={() => playback.step(stepSize)} aria-label={`Forward ${stepSize}`}>
                            <SkipNextIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={LABELS.replay} placement="top">
                        <IconButton onClick={playback.reset} aria-label={LABELS.replay}>
                            <ReplayIcon />
                        </IconButton>
                    </Tooltip>

                    <NumberField
                        label={LABELS.stepSize}
                        showLabel
                        value={stepSize}
                        min={MIN_STEP_SIZE}
                        max={MAX_STEP_SIZE}
                        width={TRANSPORT_BUTTONS_WIDTH}
                        onChange={setStepSize}
                    />

                    <Tooltip describeChild title={HINTS.counter} placement="top">
                        <Typography variant="body1" sx={{ fontVariantNumeric: "tabular-nums", cursor: "help", pl: 1 }}>
                            {stepCounter(playback.index, steps)}
                        </Typography>
                    </Tooltip>
                </Stack>
            </Box>
        </Box>
    );
}