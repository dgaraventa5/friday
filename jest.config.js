export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.app.json',
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!.*\\.mjs$)'
  ],
  setupFiles: ['./jest.setup.ts'],
};