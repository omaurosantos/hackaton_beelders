import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Red Hat Text", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#304ffe",
          light:   "#c9d9ff",
          lightest:"#edf2ff",
          dark:    "#143182",
        },
        fog: {
          50:  "#f6f7f8",
          100: "#e8eaee",
          200: "#d5d9e0",
          300: "#b9bfc7",
          400: "#9fa5ad",
          500: "#868d95",
          600: "#697077",
          700: "#50565b",
          800: "#373d42",
          900: "#242a2e",
          950: "#13171a",
        },
        risk: {
          high:   "#da1e28",
          highBg: "#fccfd2",
          mid:    "#8a5c00",
          midBg:  "#ffe1a8",
          low:    "#198038",
          lowBg:  "#9deeb2",
        },
      },
      borderRadius: {
        sm:   "4px",
        md:   "8px",
        lg:   "12px",
        xl:   "16px",
        "2xl":"24px",
        full: "9999px",
      },
      boxShadow: {
        sm: "inset 0 0 0 1px #e8eaee, 0 8px 16px -8px rgba(19,23,26,.24)",
        md: "inset 0 0 0 1px #e8eaee, 0 12px 24px -12px rgba(19,23,26,.24)",
        lg: "inset 0 0 0 1px #e8eaee, 0 16px 32px -16px rgba(19,23,26,.24)",
        focus: "0 0 0 2px white, 0 0 0 4px rgba(48,79,254,.8)",
      },
    },
  },
  plugins: [],
};
export default config;
