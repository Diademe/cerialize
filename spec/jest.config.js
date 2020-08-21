module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: "../",
    globals: {
        'ts-jest': {
            tsConfig: 'spec/tsconfig.spec.json'
        }
    },
    collectCoverageFrom: [
        "src/**/*.ts"
    ]
};