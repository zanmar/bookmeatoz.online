module.exports = {
  preset: 'ts-jest', // Use ts-jest preset
  testEnvironment: 'node', // Environment for testing Node.js applications
  roots: ['<rootDir>/src'], // Look for tests within the src directory
  testMatch: [ // Patterns Jest uses to detect test files
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json', // Path to your tsconfig.json
      // diagnostics: {
      //   ignoreCodes: ['TS151001'] // Example: ignore specific TS diagnostic codes if needed
      // }
    }],
  },
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    // Must match the "paths" in your tsconfig.json
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test-setup/jest.setup.ts'], // Optional: For global setup after environment is set
  clearMocks: true, // Automatically clear mock calls and instances between every test
  collectCoverage: true, // Enable test coverage collection
  coverageDirectory: "coverage", // Directory where coverage reports will be saved
  coverageProvider: "v8", // or "babel"
  coverageReporters: ["json", "text", "lcov", "clover"],
  // Optional: Configure coverage thresholds
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: -10, // Example: allow 10 uncovered statements
  //   },
  // },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true, // Output more information during tests
};
