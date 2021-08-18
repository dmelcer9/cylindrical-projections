const path = require("path");
const CopyPlugin = require('copy-webpack-plugin');
module.exports = {
    entry: {
        app: './src/index.ts'
    },
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    devtool: 'source-map',
    plugins: [
        new CopyPlugin({
            patterns: [
                {from: 'html', to: '.'},
            ]
        }),
    ],
    module: {
        rules: [ {
            test: /\.tsx?$/,
            loader: 'ts-loader',
            exclude: /node_modules/
        }]
    }
}
