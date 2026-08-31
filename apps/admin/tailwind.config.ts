import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0d14",
        foreground: "#e8eaf0",
        card: "#111520",
        "card-border": "#1e2236",
        muted: "#1c2030",
        "muted-foreground": "#6b7494",
        primary: "#6366f1",
        "primary-foreground": "#ffffff",
        "primary-hover": "#5254cc",
        accent: "#8b5cf6",
        border: "#1e2236",
        destructive: "#ef4444",
        success: "#22c55e",
        amber: "#f59e0b",
      },
    },
  },
  plugins: [],
};

export default config;
