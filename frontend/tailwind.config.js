/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: { primary: "#151618", surface: "#1A1D21", text: "#E8E9EA", muted: "#A1A7B3" },
        fire: "#FF8C00",
        dataBlue: "#0077B6",
        dataTeal: "#005F8C",
        light: { base: "#F8F9FA", card: "#FFFFFF", text: "#212529", muted: "#6C757D", border: "#DEE2E6" }
      }
    }
  },
  plugins: []
}
