module.exports = {
  root: true,
  env: {
    browser: true,
    es2024: true,
  },
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    {
      files: ['backend/**/*.js'],
      env: {
        node: true,
        es2024: true,
      },
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'script',
      },
    },
    {
      files: ['src/**/*.{js,jsx}'],
      env: {
        browser: true,
        es2024: true,
      },
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
      },
    },
  ],
};
