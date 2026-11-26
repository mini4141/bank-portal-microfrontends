module.exports = require('../../tools/webpack.mfe.cjs')({
  dir: __dirname,
  name: 'transfer',
  port: 9014,
  entry: 'src/main.tsx',
  react: true,
})
