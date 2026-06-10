import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        line: "#e5e7eb",
        paper: "#fffaf2",
        ready: "#168a4a",
        caution: "#c77900",
        danger: "#c2410c"
      },
      boxShadow: {
        crisp: "0 1px 0 rgba(17, 24, 39, 0.08), 0 18px 42px rgba(17, 24, 39, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
