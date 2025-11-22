import type { Config } from 'jest';

const config: Config = {
  rootDir: './',
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json'
    }
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  coverageDirectory: './coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts']
};

export default config;
