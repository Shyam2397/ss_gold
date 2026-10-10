/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';
import forms from '@tailwindcss/forms';

export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  darkMode: 'class',
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["[data-theme=light]"],
          primary: "#D3B04D",
          secondary: "#DD845A",
          accent: "#37CDBE",
          neutral: "#3D4451",
          "base-100": "#FFFFFF",
          "base-200": "#F9FAFB",
          "base-300": "#F3F4F6",
        },
      },
      "dark",
    ],
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
    themeRoot: ":root",
  },
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
      },
      colors: {
        primary: {
          DEFAULT: '#D3B04D',
          dark: '#B89A3D',
        },
        secondary: {
          DEFAULT: '#DD845A',
          dark: '#C66B41',
        },
        gold: {
          DEFAULT: '#C69A32',
          dark: '#9A7019',
          light: '#E4C46B',
          soft: '#F5EAD1',
          bright: '#FFD700',
        },
        charcoal: '#171715',
        ivory: '#F7F5F0',
        ink: '#202020',
        muted: '#667085',
        hairline: '#EAE7E0',
        brandsuccess: '#16A36A',
        brandwarning: '#E8A126',
        branddanger: '#DC4444',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        decorative: ['Babylonica', 'cursive'],
      },
    },
  },
  plugins: [
    daisyui,
    forms,
  ],
}
