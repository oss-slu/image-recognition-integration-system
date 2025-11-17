import type { Config } from "tailwindcss";
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    './config/**/*.{js,ts,json}',
  ],
  safelist: [
    // Text colors
    "text-cyan-300",
    "text-red-500",
    "text-blue-500",
    "text-gray-200",
    "text-gray-300",

    // Backgrounds
    "bg-gray-800",
    "bg-gray-900",
    "bg-blue-500",
    "bg-red-500",
    "bg-green-500", 
    "bg-cyan-500",
    "bg-indigo-600",
    "hover:bg-indigo-700",

    // Borders
    "border-gray-700",
    "border-blue-700"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#003DA5',
        secondary: '#C8C9C7',
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [
    // Add a 'size-{key}' shorthand that sets both width and height from the theme spacing scale.
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          size: (value: string) => ({
            width: value,
            height: value,
          }),
        },
        { values: theme('spacing') }
      );
    }),
  ],
};
export default config;
