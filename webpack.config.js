/**
 * @typedef { import("@types/webpack").Configuration } Configuration
 */
const path = require('path')
const r = p => path.resolve(__dirname, p)
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

/**
 * @type { Configuration }
 */
module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: r('src/index.ts'),
    output: {
        libraryTarget: 'commonjs',
        filename: 'index.js'
    },
    resolve: {
        extensions: ['.ts']
    },
    externals: {
        vuex: 'vuex'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'babel-loader'
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: ['**/*', '!*.d.ts']
        })
    ]
}