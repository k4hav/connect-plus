import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070B12",
        surface: "#0C1420",
        card: "#121B2A",
        cyan: { DEFAULT: "#43CFFF" },
        bright: "#7ADCFF",
        electric: "#648BFF",
        emerald: { DEFAULT: "#13B89A" },
        amber: { DEFAULT: "#FFBD65" },
        ink: "#F4F7FB",
        muted: "#9BAABD",
        success: "#34D399",
        danger: "#F87171",
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        glass: "0 10px 40px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.07)",
        float: "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.09)",
      },
    },
  },
  plugins: [],
};

export default config;
