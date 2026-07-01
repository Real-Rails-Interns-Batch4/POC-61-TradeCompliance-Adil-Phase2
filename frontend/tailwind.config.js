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
          bg: "#040A0F",        // Deep cold navy-black — Trade Compliance Visual DNA
          surface: "#070E15",   // Surface layer
          panel: "#060C12",     // Intelligence panel bg
          border: "#0F2030",    // Refined border
          cyan: "#00D4FF",      // Cyber-teal primary accent
          indigo: "#7C6EFA",    // Indigo secondary
          amber: "#F59E0B",     // Warning amber (OFAC / CUSTOMS_HOLD)
          risk: "#F43F5E",      // Risk red
          tx: "#E2EDF5",        // Primary text
          tx2: "#7A9AB5",       // Secondary text
          tx3: "#3D5A70",       // Muted text
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(100%)", opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "modal-pop": {
          "0%": { opacity: "0", transform: "scale(0.95) translateY(-8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "pulse-glow-cyan": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.7)" },
        },
        "scan-line": {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "slide-out-right": "slide-out-right 0.3s ease-in forwards",
        "fade-in": "fade-in 0.3s ease-out",
        "modal-pop": "modal-pop 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "pulse-glow-cyan": "pulse-glow-cyan 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};