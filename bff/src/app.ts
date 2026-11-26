import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import { getFlags, setLocalFlag } from './flags.js'
import * as store from './store.js'

const COOKIE = 'bk_session'
const DEMO_USER = 'taro'
const DEMO_PASSWORD = 'demo1234'

export function buildApp() {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' })
  const secret = process.env.SESSION_SECRET ?? 'dev-only-session-secret-change-me'
  app.register(cookie, { secret })

  app.addHook('onSend', async (_req, reply) => {
    reply.header('Cache-Control', 'no-store')
  })

  app.addHook('preHandler', async (req, reply) => {
    const open =
      req.url === '/healthz' || req.url === '/api/session' || req.url.startsWith('/api/flags')
    if (open) return
    const raw = req.cookies[COOKIE]
    const u = raw ? req.unsignCookie(raw) : undefined
    if (!u?.valid || u.value !== store.customer.id) {
      return reply.code(401).send({ error: 'unauthorized' })
    }
  })

  app.get('/healthz', async () => ({ status: 'ok' }))

  app.post<{ Body: { username?: string; password?: string } }>(
    '/api/session',
    async (req, reply) => {
      const { username, password } = req.body ?? {}
      if (username !== DEMO_USER || password !== DEMO_PASSWORD) {
        return reply.code(401).send({ error: 'invalid_credentials' })
      }
      reply.setCookie(COOKIE, store.customer.id, {
        signed: true,
        httpOnly: true,
        sameSite: 'lax',
        secure: req.headers['x-forwarded-proto'] === 'https',
        path: '/',
      })
      return store.customer
    },
  )

  app.delete('/api/session', async (_req, reply) => {
    reply.clearCookie(COOKIE, { path: '/' })
    return reply.code(204).send()
  })

  app.get('/api/me', async () => store.customer)
  app.get('/api/accounts', async () => store.listAccounts())
  app.get<{ Params: { id: string } }>(
    '/api/accounts/:id',
    async (req, reply) =>
      store.findAccount(req.params.id) ?? reply.code(404).send({ error: 'not_found' }),
  )
  app.get('/api/payees', async () => store.payees)

  app.get<{ Querystring: Record<string, string | undefined> }>('/api/transactions', async (req) => {
    const q = req.query
    return store.queryTransactions({
      accountId: q.accountId,
      page: Math.max(1, Number(q.page) || 1),
      size: Math.min(100, Math.max(1, Number(q.size) || 10)),
      from: q.from || undefined,
      to: q.to || undefined,
      type: q.type || undefined,
    })
  })

  app.post<{ Body: { fromAccountId: string; payeeId: string; amount: number; memo?: string } }>(
    '/api/transfers',
    async (req, reply) => {
      const { fromAccountId, payeeId, amount } = req.body ?? ({} as never)
      const account = store.findAccount(fromAccountId)
      const payee = store.payees.find((p) => p.id === payeeId)
      if (!account || !payee || !Number.isInteger(amount) || amount <= 0) {
        return reply.code(400).send({ error: 'invalid_request' })
      }
      if (amount > account.balance) return reply.code(422).send({ error: 'insufficient_funds' })
      const tx = store.addTransfer(account.id, payee.name, payee.nameJa, amount)
      return reply.code(201).send({
        id: tx.id,
        status: 'completed',
        amount,
        fromAccountId,
        balance: store.findAccount(fromAccountId)?.balance,
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
