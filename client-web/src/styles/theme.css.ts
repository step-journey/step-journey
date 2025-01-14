import { createGlobalTheme } from "@vanilla-extract/css";

export const vars = createGlobalTheme(":root", {
  font: {
    mono: "JetBrainsMono, monospace",
    sans: "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  },
  color: {
    text: "#333",
    bg: "#f9f9f9",
  },
  // etc...
});
