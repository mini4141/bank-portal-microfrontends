import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import cookie from '@fastify/cookie'
import { getFlags, setLocalFlag } from './flags.js'
import * as store from './store.js'

const COOKIE = 'bk_session'
const DEMO_USER = 'taro'
const DEMO_PASSWORD = 'demo1234'
const MAX_TRANSFERS = 40

interface Session {
  u: string
  t: store.TransferRecord[]
}

const encode = (s: Session) => Buffer.from(JSON.stringify(s)).toString('base64url')
const decode = (v: string): Session | undefined => {
  try {
    const s = JSON.parse(Buffer.from(v, 'base64url').toString('utf8')) as Session
    return s.u === store.customer.id && Array.isArray(s.t) ? s : undefined
  } catch {
    return undefined
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    session?: Session
  }
}

export function buildApp() {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' })
  const secret = process.env.SESSION_SECRET ?? 'dev-only-session-secret-change-me'
  app.register(cookie, { secret })

  // The session is a signed, HttpOnly cookie: customer id + this session's transfers (stateless BFF).
  const writeSession = (req: FastifyRequest, reply: FastifyReply, session: Session) =>
    reply.setCookie(COOKIE, encode(session), {
      signed: true,
      httpOnly: true,
      sameSite: 'lax',
      secure: req.headers['x-forwarded-proto'] === 'https',
      path: '/',
    })

  app.addHook('onSend', async (_req, reply) => {
    reply.header('Cache-Control', 'no-store')
  })

  app.addHook('preHandler', async (req, reply) => {
    const open =
      req.url === '/healthz' || req.url === '/api/session' || req.url.startsWith('/api/flags')
    if (open) return
    const raw = req.cookies[COOKIE]
    const unsigned = raw ? req.unsignCookie(raw) : undefined
    req.session = unsigned?.valid && unsigned.value ? decode(unsigned.value) : undefined
    if (!req.session) return reply.code(401).send({ error: 'unauthorized' })
  })

  const transfers = (req: FastifyRequest) => req.session?.t ?? []

  app.get('/healthz', async () => ({ status: 'ok' }))

  app.post<{ Body: { username?: string; password?: string } }>(
    '/api/session',
    async (req, reply) => {
      const { username, password } = req.body ?? {}
      if (username !== DEMO_USER || password !== DEMO_PASSWORD) {
        return reply.code(401).send({ error: 'invalid_credentials' })
      }
      writeSession(req, reply, { u: store.customer.id, t: [] })
      return store.customer
    },
  )

  app.delete('/api/session', async (_req, reply) => {
    reply.clearCookie(COOKIE, { path: '/' })
    return reply.code(204).send()
  })

  app.get('/api/me', async () => store.customer)
  app.get('/api/accounts', async (req) => store.listAccounts(transfers(req)))
  app.get<{ Params: { id: string } }>(
    '/api/accounts/:id',
    async (req, reply) =>
      store.findAccount(req.params.id, transfers(req)) ??
      reply.code(404).send({ error: 'not_found' }),
  )
  app.get('/api/payees', async () => store.payees)

  app.get<{ Querystring: Record<string, string | undefined> }>('/api/transactions', async (req) => {
    const q = req.query
    return store.queryTransactions(
      {
        accountId: q.accountId,
        page: Math.max(1, Number(q.page) || 1),
        size: Math.min(100, Math.max(1, Number(q.size) || 10)),
        from: q.from || undefined,
        to: q.to || undefined,
        type: q.type || undefined,
      },
      transfers(req),
    )
  })

  app.post<{ Body: { fromAccountId: string; payeeId: string; amount: number; memo?: string } }>(
    '/api/transfers',
    async (req, reply) => {
      const { fromAccountId, payeeId, amount } = req.body ?? ({} as never)
      const mine = transfers(req)
      const account = store.findAccount(fromAccountId, mine)
      const payee = store.payees.find((p) => p.id === payeeId)
      if (!account || !payee || !Number.isInteger(amount) || amount <= 0) {
        return reply.code(400).send({ error: 'invalid_request' })
      }
      if (amount > account.balance) return reply.code(422).send({ error: 'insufficient_funds' })
      if (mine.length >= MAX_TRANSFERS) return reply.code(429).send({ error: 'transfer_limit' })

      const record: store.TransferRecord = [
        account.id,
        amount,
        new Date().toISOString().slice(0, 10),
        payee.id,
      ]
      const next = [...mine, record]
      writeSession(req, reply, { u: store.customer.id, t: next })
      return reply.code(201).send({
        id: `tx-t${String(next.length).padStart(4, '0')}`,
        status: 'completed',
        amount,
        fromAccountId,
        balance: account.balance - amount,
      })
    },
  )

  app.get<{
    Params: { accountId: string; yyyymm: string }
    Querystring: { page?: string; size?: string }
  }>('/api/statements/:accountId/:yyyymm', async (req, reply) => {
    if (!/^\d{6}$/.test(req.params.yyyymm)) return reply.code(400).send({ error: 'invalid_month' })
    const s = store.statement(
      req.params.accountId,
      req.params.yyyymm,
      Math.max(1, Number(req.query.page) || 1),
      Math.min(100, Math.max(1, Number(req.query.size) || 10)),
      transfers(req),
    )
    return s ?? reply.code(404).send({ error: 'not_found' })
  })

  app.get('/api/flags', async () => getFlags())
  app.put<{ Params: { name: string }; Body: { enabled: boolean } }>(
    '/api/flags/:name',
    async (req, reply) => {
      if (!setLocalFlag(req.params.name, Boolean(req.body?.enabled))) {
        return reply.code(403).send({ error: 'flags_are_managed_by_appconfig' })
      }
      req.log.info({ flag: req.params.name, enabled: Boolean(req.body?.enabled) }, 'flag toggled')
      return getFlags()
    },
  )

  return app
}
