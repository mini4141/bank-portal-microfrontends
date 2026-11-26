module.exports = require('../../tools/webpack.mfe.cjs')({
  dir: __dirname,
  name: 'utility',
  port: 9010,
  entry: 'src/index.ts',
})
