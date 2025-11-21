/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui"

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 1. Tipografía moderna
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'], // Usaremos DM Sans (Google Font)
      },
      // 2. Animaciones personalizadas
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'pop-in': 'popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      // 3. Keyframes (los pasos de la animación)
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    daisyui,
  ],
  daisyui: {
    themes: [
      "cupcake",
      {
        "dulce-dark": {
          "base-100": "oklch(25% 0.02 280)", 
          "base-200": "oklch(20% 0.02 280)",
          "base-300": "oklch(15% 0.02 280)",
          "primary": "oklch(60% 0.2 340)", 
          "primary-content": "oklch(98% 0.02 340)",
          "secondary": "oklch(70% 0.15 320)",
          "accent": "oklch(75% 0.18 150)",
          "neutral": "oklch(20% 0.01 280)",
          "neutral-content": "oklch(90% 0.05 280)",
          "info": "oklch(70% 0.1 240)",
          "success": "oklch(65% 0.18 140)",
          "warning": "oklch(80% 0.15 80)",
          "error": "oklch(60% 0.2 30)",
          "--rounded-box": "1rem",
          "--rounded-btn": "0.5rem",
        },
      },
    ],
    darkTheme: "dulce-dark",
  },
}