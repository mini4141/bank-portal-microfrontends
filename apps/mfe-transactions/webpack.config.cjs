module.exports = require('../../tools/webpack.mfe.cjs')({
  dir: __dirname,
  name: 'transactions',
  port: 9013,
  entry: 'src/main.ts',
})
