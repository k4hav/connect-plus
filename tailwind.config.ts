import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#080505",
        surface: "#120808",
        card: "#1A0D0D",
        cyan: { DEFAULT: "#FF3B47" },
        bright: "#FF7A80",
        electric: "#FF6A3D",
        emerald: { DEFAULT: "#13B89A" },
        amber: { DEFAULT: "#FFBD65" },
        ink: "#FBF6F6",
        muted: "#B3A3A3",
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
