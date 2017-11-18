const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const app_port = parseInt(process.env.PORT) | 5000;
const dev_port = app_port + 10;
const gui_port = dev_port + 10;


module.exports = {
  entry: './private/__entry__.jsx',
  output: {
    path: path.resolve('public'),
    filename: 'bundle.js',
  },

  devtool: 'nosources-source-map',

  plugins: [
    new BrowserSyncPlugin({
      host: 'localhost',
      port: dev_port,
      ui: { port: gui_port, },
      proxy: `http://localhost:${app_port}`,
    }),

    new HtmlWebpackPlugin({
      template: './private/html/index.html',
      filename: 'index.html',
      inject: 'body',
    }),

    new webpack.ProvidePlugin({
      '_': 'lodash',
      'React': 'react',
    }),
  ],

  module: {
    rules: [
      // JS rule
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
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
          'sass-loader',
        ]
      },

      // Fonts loader
      {
        test: /\.(woff2?|ttf)$/,
        use: ['file-loader?hash=sha512&digest=hex&name=[hash].[ext]', ],
      },

      // Image loader
      {
        test: /\.(jpe?g|png|gif|svg|mp4)$/i,
        loaders: [
          'file-loader?hash=sha512&digest=hex&name=[hash].[ext]',
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
    ],
  },
};
