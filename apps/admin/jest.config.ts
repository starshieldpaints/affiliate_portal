import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', module: 'commonjs' } }]
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@ui/(.*)$': '<rootDir>/../../packages/ui/src/$1',
    '^@config/(.*)$': '<rootDir>/../../packages/config/src/$1',
    '^@api-client$': '<rootDir>/../../packages/api-client/src/index.ts'
  }
};

export default config;
