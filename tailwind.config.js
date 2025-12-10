// tailwind.config.js
import daisyui from "daisyui"

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    daisyui,
  ],
  daisyui: {
    themes: [
      {
        "dulce-light": {
          "primary": "#ec4899",          // Pink-500
          "primary-content": "#ffffff",
          "secondary": "#fbcfe8",        // Pink-200
          "secondary-content": "#831843",
          "accent": "#d946ef",
          "accent-content": "#ffffff",
          "neutral": "#374151",
          "neutral-content": "#ffffff",
          "base-100": "#fff1f2",         // Rose-50 (Fondo calido)
          "base-200": "#ffe4e6",         // Rose-100
          "base-300": "#fecdd3",
          "base-content": "#881337",     // Texto Vino
          "info": "#67e8f9",
          "success": "#4ade80",
          "warning": "#fde047",
          "error": "#f43f5e",
        },
      },
      {
        "dulce-dark": {
          "primary": "#f472b6",          // Pink-400
          "primary-content": "#1f2937",
          "secondary": "#831843",        // Pink-900
          "secondary-content": "#fbcfe8",
          "accent": "#c026d3",
          "accent-content": "#ffffff",
          "neutral": "#1f2937",
          "neutral-content": "#f9fafb",
          "base-100": "#1a1016",         // Negro-Vino profundo
          "base-200": "#291520",
          "base-300": "#451a2b",
          "base-content": "#fce7f3",     // Texto rosa muy pálido
          "info": "#22d3ee",
          "success": "#22c55e",
          "warning": "#facc15",
          "error": "#e11d48",
        },
      },
    ],
  },
}