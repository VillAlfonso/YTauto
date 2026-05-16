import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#0a0a0b", elevated: "#131316", card: "#1a1a1f" },
        line: "#26262d",
        accent: { DEFAULT: "#ff3d57", muted: "#ff3d5733" },
        text: { DEFAULT: "#f5f5f7", muted: "#8a8a93" },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
