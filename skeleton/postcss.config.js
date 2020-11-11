const production = process.env.NODE_ENV !== 'development';
const purgecss = require('@fullhuman/postcss-purgecss');
const cssnano = require('cssnano');

module.exports = {
  plugins: [
    require('postcss-import')(),
    require('tailwindcss'),
    require('autoprefixer'),
    production &&
      purgecss({
        content: ['./src/**/*.html', './static/**/*.html', './src/**/*.svelte'],
        whitelistPatterns: [/^svelte-/],
        defaultExtractor: (content) => {
          const regExp = new RegExp(/[A-Za-z0-9-_:/.]+/g);

          const matchedTokens = [];

          let match = regExp.exec(content);
          // To make sure that you do not lose any tailwind classes used in class directive.
          // https://github.com/tailwindcss/discuss/issues/254#issuecomment-517918397
          while (match) {
            if (match[0].startsWith('class:')) {
              matchedTokens.push(match[0].substring(6));
            } else {
              matchedTokens.push(match[0]);
            }

            match = regExp.exec(content);
          }

          return matchedTokens;
        },
      }),
    production && cssnano(),
  ].filter(Boolean),
};
