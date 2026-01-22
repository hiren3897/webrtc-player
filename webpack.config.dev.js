const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.config.common');
const path = require('path');

module.exports = merge(commonConfig, {
  entry: {
    index: path.resolve(__dirname, 'src/js/index.ts'),
  },
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    port: 8082,
    client: {
      overlay: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
});
