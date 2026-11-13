/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        green: "var(--green)",
        pale: "var(--pale)",
      },
      boxShadow: {
        card: "var(--shadow)",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
