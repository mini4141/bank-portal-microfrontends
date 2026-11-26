import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import hooks from 'eslint-plugin-react-hooks'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: [
      '**/dist/**',
      '.stage/**',
      '.local/**',
      '**/node_modules/**',
      '**/storybook-static/**',
      'proof/**',
      'legacy/**',
      'infra/**',
      '**/coverage/**',
      '**/test-results/**',
      '**/.lighthouseci/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser } } },
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': hooks },
    rules: { ...hooks.configs.recommended.rules },
  },
  { languageOptions: { globals: { ...globals.browser, ...globals.node, ...globals.jest } } },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  { files: ['**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  { rules: { '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }] } },
  prettier,
]
