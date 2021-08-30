/* eslint-disable no-undef */
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  resolver: 'jest-ts-tsx-resolver',
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
};
