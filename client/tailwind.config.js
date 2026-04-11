/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bags: {
          primary: "#6366f1",
          secondary: "#8b5cf6",
          accent: "#a78bfa",
          dark: "#0a0612",
          card: "#110d1d",
          "card-hover": "#161122",
          border: "#1e1832",
          "border-hover": "#2d2640",
          text: "#e2e0ea",
          muted: "#7c7a87",
          green: "#22c55e",
          red: "#ef4444",
          yellow: "#eab308",
          blue: "#3b82f6",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "card-gradient": "linear-gradient(135deg, #110d1d 0%, #161122 100%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
