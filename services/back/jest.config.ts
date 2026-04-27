const base = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
};

module.exports = {
  projects: [
    {
      ...base,
      displayName: 'unit',
      testRegex: 'src/.*\\.spec\\.ts$',
    },
    {
      ...base,
      displayName: 'integration',
      testRegex: 'test/integration/.*\\.int-spec\\.ts$',
    },
  ],
};
