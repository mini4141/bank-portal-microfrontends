// Shared webpack 5 factory for single-spa micro-frontends (System.register output).
// Every app keeps its own webpack.config.cjs and only passes its identity here.
const path = require('node:path')
const webpack = require('webpack')
const { VueLoaderPlugin } = require('vue-loader')

module.exports = function createMfeConfig({
  dir,
  name,
  port,
  entry = 'src/main.ts',
  react = false,
}) {
  return (_env, argv) => {
    const prod = argv.mode === 'production'
    return {
      entry: path.resolve(dir, entry),
      output: {
        path: path.resolve(dir, 'dist'),
        filename: `bank-${name}.js`,
        chunkFilename: `${name}.[contenthash:8].js`,
        library: { type: 'system' },
        publicPath: 'auto',
        clean: true,
      },
      // '@bank/utility' stays external: it is a shared single-spa utility module from the import map.
      externals: ['@bank/utility'],
      devtool: prod ? 'source-map' : 'cheap-module-source-map',
      resolve: { extensions: ['.ts', '.tsx', '.js', '.vue', '.json'] },
      module: {
        rules: [
          { test: /\.vue$/, loader: 'vue-loader' },
          {
            test: /\.tsx?$/,
            loader: 'ts-loader',
            exclude: /node_modules/,
            options: {
              transpileOnly: true,
              appendTsSuffixTo: [/\.vue$/],
              configFile: path.resolve(dir, 'tsconfig.json'),
            },
          },
          { test: /\.s?css$/, use: ['style-loader', 'css-loader', 'sass-loader'] },
        ],
      },
      plugins: [
        new VueLoaderPlugin(),
        new webpack.DefinePlugin({
          __VUE_OPTIONS_API__: false,
          __VUE_PROD_DEVTOOLS__: false,
          __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
          __INTLIFY_PROD_DEVTOOLS__: false,
        }),
      ],
      optimization: { splitChunks: react ? false : { chunks: 'async' } },
      performance: { hints: false },
      devServer: {
        port,
        hot: false,
        liveReload: false,
        client: false,
        allowedHosts: 'all',
        headers: { 'Access-Control-Allow-Origin': '*' },
      },
    }
  }
}
