export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(`API ${status}: ${code}`)
  }
}

/** Same-origin fetch; the session lives in an HttpOnly cookie so no token is handled in JS. */
export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: init.method ?? 'GET',
    credentials: 'same-origin',
    headers: init.body ? { 'content-type': 'application/json' } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? 'unknown')
  return data as T
}

export interface Page<T> {
  items: T[]
  page: number
  size: number
  total: number
  totalPages: number
}

export interface Account {
  id: string
  type: 'ordinary' | 'savings' | 'fixed'
  name: string
  nameJa: string
  number: string
  openingBalance: number
  balance: number
}

export interface Transaction {
  id: string
  accountId: string
  date: string
  description: string
  descriptionJa: string
  type: 'credit' | 'debit'
  amount: number
}

export interface Payee {
  id: string
  name: string
  nameJa: string
  bank: string
  accountNumber: string
}

export interface StatementLine {
  id: string
  date: string
  description: string
  descriptionJa: string
  debit: number
  credit: number
  balance: number
}

export interface Statement extends Page<StatementLine> {
  accountId: string
  month: string
  totals: { opening: number; debit: number; credit: number; closing: number }
}
