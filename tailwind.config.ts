import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#050505",
        surface: "#0B0B0C",
        card: "#111113",
        cyan: { DEFAULT: "#FF3B47" },
        bright: "#FF7A80",
        electric: "#FF6A3D",
        emerald: { DEFAULT: "#13B89A" },
        amber: { DEFAULT: "#FFBD65" },
        ink: "#FFFFFF",
        muted: "#A3A3AB",
        success: "#34D399",
        danger: "#F87171",
      },
      fontFamily: {
        display: ["Bricolage Grotesque", "Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
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
