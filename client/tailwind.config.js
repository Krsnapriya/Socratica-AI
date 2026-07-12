/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "background": "#0b1326",
        "on-background": "#dae2fd",
        "surface": "#0b1326",
        "surface-dim": "#0b1326",
        "surface-bright": "#31394d",
        "surface-container-lowest": "#060e20",
        "surface-container-low": "#131b2e",
        "surface-container": "#171f33",
        "surface-container-high": "#222a3d",
        "surface-container-highest": "#2d3449",
        "surface-variant": "#2d3449",
        "on-surface": "#dae2fd",
        "on-surface-variant": "#c7c4d8",
        "inverse-surface": "#dae2fd",
        "inverse-on-surface": "#283044",
        "outline": "#918fa1",
        "outline-variant": "#464555",
        "surface-tint": "#c3c0ff",
        "primary": "#c3c0ff",
        "on-primary": "#1d00a5",
        "primary-container": "#4f46e5",
        "on-primary-container": "#dad7ff",
        "inverse-primary": "#4d44e3",
        "secondary": "#bace99",
        "on-secondary": "#26350f",
        "secondary-container": "#3e4e26",
        "on-secondary-container": "#acbf8c",
        "tertiary": "#ffb95f",
        "on-tertiary": "#472a00",
        "tertiary-container": "#885500",
        "on-tertiary-container": "#ffd4a4",
        "error": "#ffb4ab",
        "on-error": "#690005",
        "error-container": "#93000a",
        "on-error-container": "#ffdad6",
        "primary-fixed": "#e2dfff",
        "primary-fixed-dim": "#c3c0ff",
        "on-primary-fixed": "#0f0069",
        "on-primary-fixed-variant": "#3323cc",
        "secondary-fixed": "#d6eab4",
        "secondary-fixed-dim": "#bace99",
        "on-secondary-fixed": "#121f00",
        "on-secondary-fixed-variant": "#3c4c24",
        "tertiary-fixed": "#ffddb8",
        "tertiary-fixed-dim": "#ffb95f",
        "on-tertiary-fixed": "#2a1700",
        "on-tertiary-fixed-variant": "#653e00"
      },
      fontFamily: {
        "sans": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "label-xs": ["10px", { lineHeight: "14px", letterSpacing: "0.05em", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "500" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-lg": ["24px", { lineHeight: "32px", fontWeight: "600", letterSpacing: "-0.01em" }],
        "headline-xl-mobile": ["32px", { lineHeight: "40px", fontWeight: "700", letterSpacing: "-0.02em" }],
        "headline-xl": ["40px", { lineHeight: "48px", fontWeight: "700", letterSpacing: "-0.02em" }],
        "code-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
      },
      spacing: {
        "gutter": "1rem",         // 16px
        "margin-mobile": "1rem",  // 16px
        "margin-desktop": "2rem", // 32px
        "max-width": "1440px",
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
