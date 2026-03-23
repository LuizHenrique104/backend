module.exports = {
  roots: ['<rootDir>/src'],
  testEnvironment: 'node',
  transform: {
    '.+\\.ts$': 'ts-jest'
  },
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1'
  },
  transformIgnorePatterns: [
    "node_modules/(?!(\\@faker-js/faker)/)"
  ]
}