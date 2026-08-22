import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Harness } from "./Harness";

const root = document.getElementById("root");
if (!root) {
    throw new Error("Root element #root was not found in index.html.");
}

createRoot(root).render(
    <StrictMode>
        <Harness />
    </StrictMode>
);