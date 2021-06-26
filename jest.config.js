/** @type {import('@jest/types').Config.InitialOptions} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  resolver: 'jest-ts-tsx-resolver',
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
};
