
const jestConfig = {
  'preset': 'ts-jest',
  'clearMocks': true,
  'silent': false,
  'coverageDirectory': 'coverage',
  'rootDir': './',
  'testMatch': [
    '<rootDir>/tests/**/*.test.(ts|tsx)'
  ],
  // 'setupFiles': [
  //   '<rootDir>/tests/setupTests.ts'
  // ],
  // testEnvironment: 'jsdom', // browser-like
}
export default jestConfig