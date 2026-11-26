const path = require('node:path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = (_env, argv) => {
  const prod = argv.mode === 'production'
  return {
    entry: path.resolve(__dirname, 'src/main.ts'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bank-root-config.[contenthash:8].js',
      publicPath: '/',
      clean: true,
    },
    devtool: prod ? 'source-map' : 'cheap-module-source-map',
    resolve: { extensions: ['.ts', '.js'] },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
          options: { transpileOnly: true },
        },
        { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: 'src/index.ejs', inject: 'head', scriptLoading: 'defer' }),
      new CopyPlugin({
        patterns: [
          { from: require.resolve('systemjs/dist/system.min.js'), to: 'system.min.js' },
          { from: 'public/config.json', to: 'config.json' },
          ...(prod ? [] : [{ from: 'public/importmap.dev.json', to: 'importmap.json' }]),
        ],
      }),
    ],
    performance: { hints: false },
    devServer: {
      port: 9000,
      hot: false,
      liveReload: false,
      client: false,
      historyApiFallback: true,
      allowedHosts: 'all',
      proxy: [
        { context: ['/api'], target: 'http://localhost:3000' },
        { context: ['/legacy'], target: 'http://localhost:8081' },
      ],
    },
  }
}
