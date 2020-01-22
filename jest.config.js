module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    transformIgnorePatterns: ['<rootDir>/node_modules/(?!lodash-es)'],
}
