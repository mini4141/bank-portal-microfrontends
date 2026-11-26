// Local stand-in for CloudFront: serves .stage/, proxies /api to the BFF and /legacy to Tomcat,
// and sets the same security headers the CloudFront response-headers policy applies in the cloud.
import { createServer, request } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const PORT = Number(process.env.ROOT_PORT ?? 9000)
const BFF = { host: '127.0.0.1', port: Number(process.env.PORT ?? 3000) }
const LEGACY = { host: '127.0.0.1', port: Number(process.env.LEGACY_PORT ?? 8081) }
const ROOT = join(process.cwd(), '.stage')

export const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
    "connect-src 'self' https://dataplane.rum.ap-southeast-2.amazonaws.com https://cognito-identity.ap-southeast-2.amazonaws.com https://sts.ap-southeast-2.amazonaws.com https://*.ingest.sentry.io; " +
    "frame-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.css': 'text/css',
}

function proxy(target, req, res) {
  const upstream = request(
    {
      ...target,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `${target.host}:${target.port}` },
    },
    (r) => {
      res.writeHead(r.statusCode ?? 502, { ...r.headers, ...SECURITY_HEADERS })
      r.pipe(res)
    },
  )
  upstream.on('error', () => res.writeHead(502).end('bad gateway'))
  req.pipe(upstream)
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (url.pathname.startsWith('/api') || url.pathname === '/healthz') return proxy(BFF, req, res)
  if (url.pathname.startsWith('/legacy')) return proxy(LEGACY, req, res)

  let file = join(ROOT, normalize(url.pathname))
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory())
    file = join(ROOT, 'index.html')
  const immutable = url.pathname.startsWith('/mfe/') || /\.[0-9a-f]{8}\.js$/.test(file)
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  createReadStream(file).pipe(res)
}).listen(PORT, () => console.log(JSON.stringify({ msg: 'stage server listening', port: PORT })))
