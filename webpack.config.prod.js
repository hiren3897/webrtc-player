const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.config.common');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const packageJson = require('./package.json');

/**
 * Build Datetime string to include in banner/licence and websocket
 * @returns {string}
 */
function getBuildDatetime() {
  let hours, minutes;
  const now = new Date();
  hours = now.getHours();
  hours = (hours >= 10) ? hours : '0' + hours;
  minutes = now.getMinutes();
  minutes = (minutes >= 10) ? minutes : '0' + minutes;
  let day = now.getDate();
  day = (day >= 10) ? day : '0' + day;
  const years = now.getFullYear();
  let months = now.getUTCMonth() + 1;
  months = (months >= 10) ? months : '0' + months;
  return `${years}-${months}-${day}-${hours}-${minutes}`;
}

const version = packageJson.version;

module.exports = merge(commonConfig, {
  entry: {
    index: path.resolve(__dirname, 'src/js/webRTCPlayer.js')
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css'
    })
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: {
          condition: /^\**!|@preserve|@license|@cc_on/i,
          banner: (licenseFile) => {
            return `
WebRTC Player 
  Version: ${version}
  Build TimeStamp: ${getBuildDatetime()}
  License information can be found in ${licenseFile}
`;
          },

        }

      }),
      new CssMinimizerPlugin()
    ]
  }
});
