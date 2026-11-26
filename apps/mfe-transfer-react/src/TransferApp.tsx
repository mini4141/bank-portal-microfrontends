import { useEffect, useState, type FormEvent } from 'react'
import {
  api,
  ApiError,
  BALANCE_EVENT,
  formatCurrency,
  getLocale,
  onLocaleChange,
  t,
  track,
  type Account,
  type Locale,
  type Payee,
} from '@bank/utility'

type Step = 'form' | 'confirm' | 'done'

export default function TransferApp() {
  const [locale, setLocaleState] = useState<Locale>(getLocale())
  const [accounts, setAccounts] = useState<Account[]>([])
  const [payees, setPayees] = useState<Payee[]>([])
  const [fromAccountId, setFrom] = useState('')
  const [payeeId, setPayee] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => onLocaleChange(setLocaleState), [])
  useEffect(() => {
    Promise.all([api<Account[]>('/accounts'), api<Payee[]>('/payees')]).then(([a, p]) => {
      setAccounts(a)
      setPayees(p)
      setFrom(a[0]?.id ?? '')
      setPayee(p[0]?.id ?? '')
    })
  }, [])

  const tr = (key: string, params?: Record<string, string | number>) => t(key, params, locale)
  const payee = payees.find((p) => p.id === payeeId)
  const payeeName = payee ? (locale === 'ja' ? payee.nameJa : payee.name) : ''
  const yen = Number(amount)

  function review(e: FormEvent) {
    e.preventDefault()
    setError('')
    setStep('confirm')
  }

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      await api('/transfers', {
        method: 'POST',
        body: { fromAccountId, payeeId, amount: yen, memo },
      })
      track('transfer_submitted', { amount: yen, currency: 'JPY' })
      window.dispatchEvent(new CustomEvent(BALANCE_EVENT))
      setStep('done')
    } catch (e) {
      setError(
        e instanceof ApiError && e.code === 'insufficient_funds'
          ? tr('transfer.insufficient')
          : tr('transfer.failed'),
      )
      setStep('form')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setAmount('')
    setMemo('')
    setStep('form')
  }

  return (
    <section className="transfer">
      <h1>{tr('transfer.title')}</h1>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {step === 'form' && (
        <form onSubmit={review}>
          <label>
            {tr('transfer.from')}
            <select value={fromAccountId} onChange={(e) => setFrom(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {(locale === 'ja' ? a.nameJa : a.name) +
                    ' — ' +
                    formatCurrency(a.balance, locale)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {tr('transfer.payee')}
            <select value={payeeId} onChange={(e) => setPayee(e.target.value)}>
              {payees.map((p) => (
                <option key={p.id} value={p.id}>
                  {locale === 'ja' ? p.nameJa : p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {tr('transfer.amount')}
            <input
              type="number"
              min="1"
              step="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            {tr('transfer.memo')}
            <input value={memo} maxLength={40} onChange={(e) => setMemo(e.target.value)} />
          </label>
          <div className="actions">
            <button type="submit">{tr('transfer.review')}</button>
          </div>
        </form>
      )}

      {step === 'confirm' && (
        <div className="panel">
          <h2>{tr('transfer.confirmTitle')}</h2>
          <p>
            {payeeName} — <strong>{formatCurrency(yen, locale)}</strong>
          </p>
          {memo && <p>{memo}</p>}
          <div className="actions">
            <button type="button" className="secondary" onClick={() => setStep('form')}>
              {tr('transfer.back')}
            </button>
            <button type="button" disabled={busy} onClick={confirm}>
              {tr('transfer.confirm')}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="panel" role="status">
          <h2>{tr('transfer.success')}</h2>
          <p>
            {tr('transfer.successDetail', {
              amount: formatCurrency(yen, locale),
              payee: payeeName,
            })}
          </p>
          <div className="actions">
            <button type="button" onClick={reset}>
              {tr('transfer.newTransfer')}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
