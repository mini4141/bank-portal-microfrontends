module.exports = require('../../tools/webpack.mfe.cjs')({
  dir: __dirname,
  name: 'statements',
  port: 9015,
  entry: 'src/main.ts',
})
