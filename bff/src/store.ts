import seed from '../data/seed.json'

export type Tx = (typeof seed.transactions)[number]
export type Account = (typeof seed.accounts)[number]
/** A transfer made in this session: [accountId, amount, date, payeeId]. Carried in the signed session cookie. */
export type TransferRecord = [string, number, string, string]

export const customer = seed.customer
export const payees = seed.payees

const net = (t: Tx) => (t.type === 'credit' ? t.amount : -t.amount)

/**
 * Seed transactions plus this session's transfers. Transfers live in the signed cookie (not in server
 * memory) so every Lambda instance, warm or cold, shows the same balances.
 */
function all(transfers: TransferRecord[]): Tx[] {
  const mine = transfers.map(([accountId, amount, date, payeeId], i): Tx => {
    const p = payees.find((x) => x.id === payeeId)
    return {
      id: `tx-t${String(i + 1).padStart(4, '0')}`,
      accountId,
      date,
      description: `Transfer to ${p?.name}`,
      descriptionJa: `${p?.nameJa}様へ振込`,
      type: 'debit',
      amount,
    }
  })
  return [...seed.transactions, ...mine]
}

export function balanceOf(a: Account, transfers: TransferRecord[], before?: string): number {
  return (
    a.openingBalance +
    all(transfers)
      .filter((t) => t.accountId === a.id && (!before || t.date < before))
      .reduce((s, t) => s + net(t), 0)
  )
}

export const listAccounts = (transfers: TransferRecord[]) =>
  seed.accounts.map((a) => ({ ...a, balance: balanceOf(a, transfers) }))
export const findAccount = (id: string, transfers: TransferRecord[]) =>
  listAccounts(transfers).find((a) => a.id === id)

export interface TxQuery {
  accountId?: string
  page: number
  size: number
  from?: string
  to?: string
  type?: string
}

const newestFirst = (a: Tx, b: Tx) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)

export function queryTransactions(q: TxQuery, transfers: TransferRecord[]) {
  const rows = all(transfers)
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
export function statement(
  accountId: string,
  yyyymm: string,
  page: number,
  size: number,
  transfers: TransferRecord[],
) {
  const account = seed.accounts.find((a) => a.id === accountId)
  if (!account) return undefined
  const month = `${yyyymm.slice(0, 4)}-${yyyymm.slice(4, 6)}`
  const rows = all(transfers)
    .filter((t) => t.accountId === accountId && t.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const opening = balanceOf(account, transfers, `${month}-01`)
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
