import { resetObservers, stubResizeObserver } from "@stefanos-larkou/sim-kit/testing";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { resetContexts, stubCanvas, stubPointerCapture } from "./test-support";

stubResizeObserver();
stubCanvas();
stubPointerCapture();

afterEach(() => {
    cleanup();
    localStorage.clear();
    resetObservers();
    resetContexts();
});