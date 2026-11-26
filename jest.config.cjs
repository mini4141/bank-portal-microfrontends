const path = require('node:path')

/** Single Jest config for all workspaces. */
module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
  roots: ['<rootDir>/packages', '<rootDir>/apps'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.(tsx?|m?js)$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.jest.json', diagnostics: false },
    ],
  },
  transformIgnorePatterns: ['/node_modules/(?!(pinia|nostics|@vue/devtools-api)/)'],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/tools/style-stub.cjs',
  },
  globals: {
    'vue-jest': {
      tsConfig: path.resolve(__dirname, 'tsconfig.jest.json'),
      experimentalCSSCompile: false,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tools/jest.setup.ts'],
  reporters: [
    'default',
    [
      'jest-junit',
      { outputDirectory: process.env.JEST_JUNIT_DIR || 'coverage', outputName: 'jest-junit.xml' },
    ],
  ],
}
