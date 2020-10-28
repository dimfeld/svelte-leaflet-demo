module.exports = {
  purge: false,
  theme: {
    extend: {
      animation: {
        'dash-offset': 'dash-offset var(--animation-speed, 2s) linear infinite',
      },
      keyframes: {
        'dash-offset': {
          from: {
            'stroke-dashoffset': 'var(--dash-length, 18)',
          },
          to: {
            'stroke-dashoffset': '0',
          },
        },
      },
    },
  },
  variants: {},
  plugins: [require('@tailwindcss/ui')],
  experimental: {
    applyComplexClasses: true,
    defaultLineHeights: true,
  },
};
