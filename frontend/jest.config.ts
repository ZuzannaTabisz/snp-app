import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});


const customJestConfig: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  testTimeout: 180000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default createJestConfig(customJestConfig);