module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  // Never reset or affect the existing GB+ forms, settings or navigation.
  corePlugins: { preflight: false },
  important: ".gb-react-charts",
  theme: { extend: {} },
  plugins: []
};
