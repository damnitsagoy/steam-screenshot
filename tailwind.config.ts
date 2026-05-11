import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CRT phosphor palette
        bg: "#05080a",
        panel: "#0a0f0d",
        phosphor: {
          DEFAULT: "#39ff14",
          dim: "#1fae0c",
          dark: "#0a3d05",
          amber: "#ffb000",
          red: "#ff3b3b",
        },
      },
      fontFamily: {
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "monospace"],
        terminal: ["var(--font-vt323)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        phosphor: "0 0 12px rgba(57,255,20,0.35), inset 0 0 40px rgba(57,255,20,0.06)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "45%":      { opacity: "0.97" },
          "50%":      { opacity: "0.92" },
          "55%":      { opacity: "0.98" },
        },
        blink: {
          "0%, 50%":  { opacity: "1" },
          "50.01%, 100%": { opacity: "0" },
        },
        scan: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        flicker: "flicker 3s infinite",
        blink:   "blink 1s steps(1) infinite",
        scan:    "scan 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
