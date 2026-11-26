// Deterministic seed generator. Output is committed as bff/data/seed.json.
import { writeFileSync } from 'node:fs'

let s = 20260901
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32
const pick = (a) => a[Math.floor(rnd() * a.length)]

const debits = [
  ['Convenience store', 'コンビニエンスストア', 300, 1500],
  ['Supermarket', 'スーパーマーケット', 1200, 9000],
  ['Train pass top-up', '交通系ICチャージ', 1000, 5000],
  ['Electricity bill', '電気料金', 4500, 9000],
  ['Gas bill', 'ガス料金', 2500, 6000],
  ['Restaurant', 'レストラン', 1800, 8000],
  ['Online shopping', 'オンラインショッピング', 2000, 20000],
  ['Mobile phone', '携帯電話料金', 3980, 3980],
  ['ATM withdrawal', 'ATM出金', 5000, 30000],
]
const credits = [
  ['Salary', '給与', 280000, 280000],
  ['Refund', '返金', 800, 6000],
  ['Interest', '利息', 20, 400],
  ['Transfer received', '振込入金', 5000, 40000],
]

const accounts = [
  {
    id: 'acc-001',
    type: 'ordinary',
    name: 'Ordinary Account',
    nameJa: '普通預金',
    number: '0123456',
    openingBalance: 350000,
    count: 70,
  },
  {
    id: 'acc-002',
    type: 'savings',
    name: 'Savings Account',
    nameJa: '貯蓄預金',
    number: '7654321',
    openingBalance: 1200000,
    count: 30,
  },
  {
    id: 'acc-003',
    type: 'fixed',
    name: 'Time Deposit',
    nameJa: '定期預金',
    number: '1122334',
    openingBalance: 3000000,
    count: 20,
  },
]

const transactions = []
let n = 1
for (const a of accounts) {
  for (let i = 0; i < a.count; i++) {
    const day = Math.floor((i / a.count) * 86) // 2026-09-01 .. 2026-11-25
    const d = new Date(Date.UTC(2026, 8, 1 + day))
    const isCredit = a.id === 'acc-001' ? i % 14 === 0 : rnd() < 0.3
    const [desc, descJa, lo, hi] = isCredit ? pick(credits) : pick(debits)
    const amount = Math.round(lo + rnd() * (hi - lo))
    transactions.push({
      id: `tx-${String(n++).padStart(4, '0')}`,
      accountId: a.id,
      date: d.toISOString().slice(0, 10),
      description: desc,
      descriptionJa: descJa,
      type: isCredit ? 'credit' : 'debit',
      amount,
    })
  }
}
transactions.sort((x, y) => x.date.localeCompare(y.date) || x.id.localeCompare(y.id))

const seed = {
  customer: { id: 'cust-001', username: 'taro', name: 'Yamada Taro', nameJa: '山田 太郎' },
  accounts: accounts.map(({ count: _c, ...rest }) => rest),
  payees: [
    {
      id: 'pay-001',
      name: 'Sato Hanako',
      nameJa: '佐藤 花子',
      bank: 'Sakura Bank',
      accountNumber: '1010101',
    },
    {
      id: 'pay-002',
      name: 'Suzuki Ichiro',
      nameJa: '鈴木 一郎',
      bank: 'Fuji Bank',
      accountNumber: '2020202',
    },
    {
      id: 'pay-003',
      name: 'Tanaka Shop',
      nameJa: '田中商店',
      bank: 'Mizuho Trust',
      accountNumber: '3030303',
    },
  ],
  transactions,
}
writeFileSync(new URL('../data/seed.json', import.meta.url), JSON.stringify(seed, null, 2) + '\n')
console.log(`seed: ${accounts.length} accounts, ${transactions.length} transactions`)
