/**
 * @typedef { import("@types/webpack").Configuration } Configuration
 */
const path = require('path')
const r = p => path.resolve(__dirname, p)
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const isProd = process.env.NODE_ENV === 'production'

/**
 * @type { Configuration }
 */
module.exports = {
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'source-map',
    entry: {
        index: r('src/index.ts'),
    },
    output: {
        libraryTarget: 'commonjs',
    },
    resolve: {
        extensions: ['.ts'],
    },
    externals: {
        vuex: 'vuex',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'babel-loader',
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: ['**/*', '!*.d.ts'],
        }),
    ],
}
