module.exports = require('../../tools/webpack.mfe.cjs')({
  dir: __dirname,
  name: 'accounts',
  port: 9012,
  entry: 'src/main.ts',
})
