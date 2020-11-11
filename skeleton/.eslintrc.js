const jsRules = {
  'no-unused-vars': ['warn', { args: 'none' }],
  'no-return-await': 'warn',
  'no-use-before-define': 'error',
  'no-mixed-spaces-and-tabs': 'error',
  'no-trailing-spaces': 'warn',
};

module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['**/*.svelte'],
      parser: 'espree',
      processor: 'svelte3/svelte3',
      extends: ['eslint:recommended'],
      rules: jsRules,
    },
    {
      files: ['**/*.js'],
      extends: ['eslint:recommended'],
      rules: jsRules,
    },
  ],
  plugins: ['@typescript-eslint/eslint-plugin', 'svelte3'],
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'prettier/@typescript-eslint',
  ],
  rules: {},
};
