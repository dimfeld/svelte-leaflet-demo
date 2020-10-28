module.exports = {
  purge: false,
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [require('@tailwindcss/ui')],
  experimental: {
    applyComplexClasses: true,
    defaultLineHeights: true,
  },
};
