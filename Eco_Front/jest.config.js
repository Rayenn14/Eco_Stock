module.exports = {
  // Use ts-jest for TypeScript support without React Native complexity
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Root directory
  roots: ['<rootDir>'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.simple.js'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],

  // Transform files
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }]
  },

  // Module name mapper for React Native modules
  moduleNameMapper: {
    '^react-native$': '<rootDir>/node_modules/react-native',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/asyncStorage.js',
  },

  // Coverage
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.styles.ts',
    '!src/**/index.ts',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/contexts/', // Skip React component tests for now
  ],
};
