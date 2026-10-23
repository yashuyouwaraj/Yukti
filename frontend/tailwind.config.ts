import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./types/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { extend: { colors: { yukti: { navy: "#0B1020", indigo: "#6366F1", violet: "#8B5CF6", blue: "#3B82F6", cyan: "#06B6D4" } } } },
  plugins: [],
};
export default config;
