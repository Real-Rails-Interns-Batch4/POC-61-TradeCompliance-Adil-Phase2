/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dex: {
          // ── Maritime Visual DNA Palette ──────────────────────────
          bg:      "#020B12",   // Deep midnight charcoal-blue — Maritime DNA (Luminance ~4%)
          surface: "#050F18",   // Surface layer
          panel:   "#040D16",   // Intelligence panel / card bg
          border:  "#0C1E2E",   // Refined maritime border
          // ── Accent Colors ────────────────────────────────────────
          cyan:    "#00D4FF",   // Cyber-teal primary accent
          indigo:  "#7C6EFA",   // Indigo secondary (in-transit)
          amber:   "#F59E0B",   // Warning amber (OFAC / CUSTOMS_HOLD)
          risk:    "#F43F5E",   // Risk red
          // ── Text ─────────────────────────────────────────────────
          tx:  "#DCF0FF",       // Primary text (cool maritime white)
          tx2: "#6A9BB8",       // Secondary text
          tx3: "#2E4A60",       // Muted text
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to:   { transform: "translateX(0)",    opacity: "1" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)",    opacity: "1" },
          to:   { transform: "translateX(100%)", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "modal-pop": {
          "0%":   { opacity: "0", transform: "scale(0.93) translateY(-10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "pulse-glow-cyan": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(0, 212, 255, 0.3)" },
          "50%":       { boxShadow: "0 0 24px rgba(0, 212, 255, 0.75)" },
        },
        "blink-dot": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.15" },
        },
      },
      animation: {
        "slide-in-right":  "slide-in-right 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "slide-out-right": "slide-out-right 0.3s ease-in forwards",
        "fade-in":         "fade-in 0.3s ease-out forwards",
        "modal-pop":       "modal-pop 0.26s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "pulse-glow-cyan": "pulse-glow-cyan 2s ease-in-out infinite",
        "blink":           "blink-dot 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};