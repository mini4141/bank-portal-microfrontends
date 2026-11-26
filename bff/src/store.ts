import seed from '../data/seed.json'

export type Tx = (typeof seed.transactions)[number]
export type Account = (typeof seed.accounts)[number]

const transactions: Tx[] = structuredClone(seed.transactions)

export const customer = seed.customer
export const payees = seed.payees

const net = (t: Tx) => (t.type === 'credit' ? t.amount : -t.amount)

export function balanceOf(a: Account, before?: string): number {
  return (
    a.openingBalance +
    transactions
      .filter((t) => t.accountId === a.id && (!before || t.date < before))
      .reduce((s, t) => s + net(t), 0)
  )
}

export const listAccounts = () => seed.accounts.map((a) => ({ ...a, balance: balanceOf(a) }))
export const findAccount = (id: string) => listAccounts().find((a) => a.id === id)

export interface TxQuery {
  accountId?: string
  page: number
  size: number
  from?: string
  to?: string
  type?: string
}

const newestFirst = (a: Tx, b: Tx) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)

export function queryTransactions(q: TxQuery) {
  const rows = transactions
    .filter(
      (t) =>
        (!q.accountId || t.accountId === q.accountId) &&
        (!q.from || t.date >= q.from) &&
        (!q.to || t.date <= q.to) &&
        (!q.type || t.type === q.type),
    )
    .sort(newestFirst)
  const start = (q.page - 1) * q.size
  return {
    items: rows.slice(start, start + q.size),
    page: q.page,
    size: q.size,
    total: rows.length,
    totalPages: Math.max(1, Math.ceil(rows.length / q.size)),
  }
}

/** Monthly statement. Mirrors the kept rules of the legacy JSP (see docs/migration/statements.md). */
export function statement(accountId: string, yyyymm: string, page: number, size: number) {
  const account = seed.accounts.find((a) => a.id === accountId)
  if (!account) return undefined
  const month = `${yyyymm.slice(0, 4)}-${yyyymm.slice(4, 6)}`
  const rows = transactions
    .filter((t) => t.accountId === accountId && t.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const opening = balanceOf(account, `${month}-01`)
  let running = opening
  const lines = rows.map((t) => {
    running += net(t)
    return {
      id: t.id,
      date: t.date,
      description: t.description,
      descriptionJa: t.descriptionJa,
      debit: t.type === 'debit' ? t.amount : 0,
      credit: t.type === 'credit' ? t.amount : 0,
      balance: running,
    }
  })
  const start = (page - 1) * size
  return {
    accountId,
    month,
    page,
    size,
    total: lines.length,
    totalPages: Math.max(1, Math.ceil(lines.length / size)),
    items: lines.slice(start, start + size),
    totals: {
      opening,
      debit: lines.reduce((s, l) => s + l.debit, 0),
      credit: lines.reduce((s, l) => s + l.credit, 0),
      closing: running,
    },
  }
}

let seq = 1
export function addTransfer(
  accountId: string,
  payeeName: string,
  payeeNameJa: string,
  amount: number,
) {
  const tx: Tx = {
    id: `tx-t${String(seq++).padStart(4, '0')}`,
    accountId,
    date: new Date().toISOString().slice(0, 10),
    description: `Transfer to ${payeeName}`,
    descriptionJa: `${payeeNameJa}様へ振込`,
    type: 'debit',
    amount,
  }
  transactions.push(tx)
  return tx
}
