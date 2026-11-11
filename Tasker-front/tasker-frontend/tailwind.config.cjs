module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta "Local y cálido"
        primary: "#0f766e",            // teal — acciones principales (texto blanco AA)
        "primary-dark": "#115e59",
        crema: "#faf7f2",               // fondo general
        arena: "#e7e0d5",               // bordes
        tinta: "#1c1917",               // texto / botones oscuros
        piedra: "#57534e",              // texto secundario
        miel: { DEFAULT: "#fde68a", dark: "#78350f" }, // resaltados
        menta: { DEFAULT: "#ccfbf1", dark: "#115e59" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Bricolage Grotesque'", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
