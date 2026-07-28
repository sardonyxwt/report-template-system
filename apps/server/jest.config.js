module.exports = {
  displayName: 'server',
  preset: '../../jest.preset.js',
  globalSetup: '<rootDir>/test/support/global-setup.ts',
  globalTeardown: '<rootDir>/test/support/global-teardown.ts',
  setupFiles: ['<rootDir>/test/support/global-test-setup.ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  transformIgnorePatterns: ['node_modules/(?!(file-type)/)'],
  runner: require.resolve('jest-serial-runner'),
  moduleFileExtensions: ['ts', 'js', 'html'],
  coveragePathIgnorePatterns: ['<rootDir>/test/'],
  coverageDirectory: '../../coverage/apps/server',
};
