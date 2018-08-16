import BrowserSyncPlugin from 'browser-sync-webpack-plugin';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';
import webpack from 'webpack';


const app_port = Number(process.env.PORT) || 5000;
const dev_port = app_port + 10;
const gui_port = dev_port + 10;

const PROD = (process.env.NODE_ENV === 'production');
if (PROD) {
    console.log('Production build! 🎉🎉🎉')  // eslint-disable-line
}

const babelOptions = {
    babelrc: false,
    presets: [
        [
            'env',
            {
                modules: false,
                targets: {
                    browsers: [
                        'last 2 Chrome versions',
                        'last 2 Firefox versions',
                        'last 2 Safari versions',
                        'last 2 Edge versions',
                    ]
                }
            }
        ], 'stage-1', 'react'
    ],
};

// Loader to use for loose files
const fileHash = 'file-loader?hash=sha512&digest=hex&name=[hash].[ext]';


export default {
    // Sometimes you have to tell webpack to SHUT UP
    // stats: 'minimal',

    mode: PROD ? 'production' : 'development',

    entry: './private/__entry__',

    output: {
        path: path.resolve('./public'),
        filename: '[name].[chunkhash].js',
    },

    resolve: {
        extensions: ['.js', '.es6', '.jsx'],
    },

    devtool: PROD ? 'nosources-source-map' : 'cheap-eval-source-map',

    plugins: [
        PROD && new UglifyJsPlugin({
            parallel: true,
            sourceMap: true,
            uglifyOptions: {
                ecma: 8,
            },
        }),

        PROD && new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),

        // Clean up the build folder
        new CleanWebpackPlugin([
            './public/*.*'
        ]),

        new BrowserSyncPlugin({
            host: 'localhost',
            port: dev_port,
            ui: { port: gui_port, },
            proxy: `http://localhost:${app_port}`,
        }),

        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './private/html/index.html',
        }),

        new webpack.ProvidePlugin({
            '_': 'lodash',
            'React': 'react',
        }),

    ].filter(Boolean),  // Remove the empty entries

    module: {
        rules: [
            // JS rule
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: [
                    { loader: 'babel-loader', options: babelOptions }
                ]
            },

            // CSS rule
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ]
            },

            // Sass rule
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'postcss-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            includePaths: [
                                './node_modules'
                            ]
                        }
                    }
                ]
            },

            // Fonts loader
            {
                test: /\.(eot|woff2?|ttf)$/,
                use: [fileHash, ],
            },

            // Image loader
            {
                test: /\.(jpe?g|png|gif|svg|mp4)$/i,
                loaders: [
                    fileHash,
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            webp: {
                                quality: 75
                            },
                        },
                    },
                ],
            },

            // HTML loader rules
            {
                test: /\.html$/,
                loaders: [
                    {
                        loader: 'html-loader',
                        options: {
                            interpolate: true,
                        },
                    },
                ],
            },

            // Markdown loader
            {
                test: /\.md$/,
                use: [
                    'html-loader',
                    'markdown-loader',
                ],
            }
        ],
    },
};
