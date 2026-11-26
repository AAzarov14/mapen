export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  roots: ['<rootDir>/tests'],
  setupFiles: ['<rootDir>/tests/env.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globalSetup: '<rootDir>/tests/global-setup.ts',
  testMatch: ['**/*.test.ts'],
  testTimeout: 30000,
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: { module: 'esnext', verbatimModuleSyntax: false, esModuleInterop: true },
      },
    ],
  },
};