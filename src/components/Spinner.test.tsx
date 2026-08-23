import { ThemeProvider, createTheme } from "@mui/material";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./Spinner";

function renderSpinner() {
    return render(<ThemeProvider theme={createTheme()}><Spinner label="Working" /></ThemeProvider>);
}

describe("Spinner", () => {
    it("says what it is waiting on", () => {
        renderSpinner();
        expect(screen.getByRole("progressbar", { name: "Working" })).toBeInTheDocument();
    });

    it("turns on a property the compositor can animate without the main thread", () => {
        renderSpinner();
        const styles = [...document.querySelectorAll("style")].map(tag => tag.textContent).join("");
        expect(styles).toContain("transform:rotate(360deg)");
    });
});
