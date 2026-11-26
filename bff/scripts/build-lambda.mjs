import { build } from 'esbuild'

await build({
  entryPoints: ['src/lambda.ts'],
  outfile: 'dist/lambda/index.mjs',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  minify: true,
  banner: { js: 'import{createRequire}from"module";const require=createRequire(import.meta.url);' },
})
console.log('lambda bundle: bff/dist/lambda/index.mjs')
