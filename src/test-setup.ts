import { resetObservers, stubResizeObserver } from "@stefanos-larkou/sim-kit/testing";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { resetContexts, stubCanvas } from "./test-support";

stubResizeObserver();
stubCanvas();

afterEach(() => {
    cleanup();
    localStorage.clear();
    resetObservers();
    resetContexts();
});