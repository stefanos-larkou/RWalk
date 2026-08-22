import { resetObservers, stubResizeObserver } from "@stefanos-larkou/sim-kit/testing";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

stubResizeObserver();

HTMLCanvasElement.prototype.getContext = () => null;

afterEach(() => {
    cleanup();
    localStorage.clear();
    resetObservers();
});