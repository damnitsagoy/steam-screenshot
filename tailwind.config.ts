import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep wine/burgundy palette inspired by Steam Replay
        ink: "#0f0a0f",
        wine: {
          950: "#160a14",
          900: "#1f0c1a",
          800: "#2a0f24",
          700: "#3b1432",
          600: "#4e1944",
        },
        accent: {
          yellow: "#f4c93c",
          green: "#7fd16a",
          teal: "#3cb5a6",
          blue: "#4c7fd8",
          pink: "#e36aa8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: [
          "var(--font-space-grotesk)",
          "var(--font-inter)",
          "ui-sans-serif",
          "sans-serif",
        ],
      },
      aspectRatio: {
        "9/16": "9 / 16",
      },
    },
  },
  plugins: [],
};

export default config;
