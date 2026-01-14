const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const ESLintPlugin = require('eslint-webpack-plugin');
const webpack = require('webpack');
const packageJson = require('./package.json');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

/**
 * Build Datetime string to include in banner/licence and websocket
 * @returns {string}
 */
function getBuildDatetime() {
  let hours, minutes;
  const now = new Date();
  hours = now.getHours();
  hours = hours >= 10 ? hours : '0' + hours;
  minutes = now.getMinutes();
  minutes = minutes >= 10 ? minutes : '0' + minutes;
  let day = now.getDate();
  day = day >= 10 ? day : '0' + day;
  const years = now.getFullYear();
  let months = now.getUTCMonth() + 1;
  months = months >= 10 ? months : '0' + months;
  return `${years}-${months}-${day}-${hours}-${minutes}`;
}

const version = packageJson.version;

module.exports = {
  plugins: [
    // new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      inject: 'body',
      template: path.resolve(__dirname, 'src/index.html'),
    }),
    new Dotenv({
      // path: './some.other.env', // load this now instead of the ones in '.env'
      safe: false, // load '.env.example' to verify the '.env' variables are all set. Can also be a string to a different file.
      allowEmptyValues: true, // allow empty variables (e.g. `FOO=`) (treat it as empty string, rather than missing)
      systemvars: false, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs.
      silent: false, // hide any errors
      defaults: true, // load '.env.defaults' as the default values if empty.
    }),
    new webpack.DefinePlugin({
      'process.env.WebRTCVersion': JSON.stringify(version),
      // TODO git revision commit hash
    }),
    new ESLintPlugin({
      files: '**/*.{ts,js}',
      exclude: ['node_modules'],
    }),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        build: true, // <--- Add this! Required for write-dts
        mode: 'write-dts',
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
        configOverwrite: {
          compilerOptions: {
            declaration: true,
            emitDeclarationOnly: true,
            declarationDir: './dist/types',
          },
        },
      },
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.(j|t)s$/, // Update this to catch .ts files
        exclude: /[\\/]node_modules[\\/]/,
        use: {
          loader: 'babel-loader',
          options: {
            sourceMaps: true, // Ensure Babel produces maps
            inputSourceMap: true,
            presets: [
              '@babel/preset-env',
              '@babel/preset-typescript', // Add this preset
            ],
          },
        },
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                api: 'modern-compiler',
              },
            },
          },
        ],
      },
    ],
  },
  output: {
    // clean: true,
    path: path.resolve(__dirname, 'dist'),
    filename: 'WebRTCPlayer.bundle.js',
    library: {
      name: 'WebRTCPlayer',
      type: 'umd',
      export: 'default',
      umdNamedDefine: true,
    },
    globalObject: 'this',
  },
};
