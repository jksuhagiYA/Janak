// Pure data model and calculations. No React Native imports here so this
// module can be unit-tested with plain Node (see finance.test.ts).

export type TxType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'bank' | 'upi' | 'card';

export interface Transaction {
  id: string;
  type: TxType;
  /** Amount in minor units (paise/cents) to avoid floating point drift. */
  amount: number;
  category: string;
  method: PaymentMethod;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  note: string;
  createdAt: number;
}

export interface Settings {
  businessName: string;
  currency: string;
}

export const DEFAULT_SETTINGS: Settings = {
  businessName: 'My Business',
  currency: '₹',
};

export const CATEGORIES: Record<TxType, string[]> = {
  income: ['Sales', 'Services', 'Commission', 'Interest', 'Refund', 'Other'],
  expense: [
    'Purchase / Stock',
    'Rent',
    'Salary',
    'Electricity',
    'Transport',
    'Phone / Internet',
    'Maintenance',
    'Tax / Fees',
    'Marketing',
    'Food',
    'Other',
  ],
};

export const PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: 'cash', label: 'Cash' },
  { key: 'bank', label: 'Bank' },
  { key: 'upi', label: 'UPI' },
  { key: 'card', label: 'Card' },
];

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Parses user input like "1,250.5" into minor units (125050). Returns null if invalid. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[,\s]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const value = Math.round(parseFloat(cleaned) * 100);
  return value > 0 ? value : null;
}

/** Minor units -> plain editable string, e.g. 125050 -> "1250.50". */
export function amountToInput(minor: number): string {
  return (minor / 100).toFixed(2).replace(/\.00$/, '');
}

/** Formats minor units with thousands separators, e.g. 12345600 -> "₹1,23,456" (Indian grouping for ₹). */
export function formatMoney(minor: number, currency: string): string {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;
  const grouped = currency === '₹' ? groupIndian(whole) : groupThousands(whole);
  const decimals = fraction ? '.' + String(fraction).padStart(2, '0') : '';
  return `${sign}${currency}${grouped}${decimals}`;
}

function groupThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function groupIndian(n: number): string {
  const s = String(n);
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

export function toDateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function shiftDateKey(key: string, days: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Month key, YYYY-MM. */
export function monthOf(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toDateKey(d).slice(0, 7);
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthLabel(month: string, short = false): string {
  const [y, m] = month.split('-').map(Number);
  return short ? MONTH_NAMES[m - 1] : `${MONTH_NAMES[m - 1]} ${y}`;
}

export function dateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

export interface Summary {
  income: number;
  expense: number;
  profit: number;
  count: number;
}

export function summarize(txs: Transaction[]): Summary {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, profit: income - expense, count: txs.length };
}

export function inMonth(txs: Transaction[], month: string): Transaction[] {
  return txs.filter((t) => monthOf(t.date) === month);
}

/** Net balance per payment method (income minus expense), across all time. */
export function balanceByMethod(txs: Transaction[]): Record<PaymentMethod, number> {
  const out: Record<PaymentMethod, number> = { cash: 0, bank: 0, upi: 0, card: 0 };
  for (const t of txs) out[t.method] += t.type === 'income' ? t.amount : -t.amount;
  return out;
}

export interface CategoryTotal {
  category: string;
  total: number;
  share: number;
}

/** Totals per category for one type, largest first; share is 0..1 of that type's total. */
export function byCategory(txs: Transaction[], type: TxType): CategoryTotal[] {
  const totals = new Map<string, number>();
  let sum = 0;
  for (const t of txs) {
    if (t.type !== type) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    sum += t.amount;
  }
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total, share: sum ? total / sum : 0 }))
    .sort((a, b) => b.total - a.total);
}

/** Income/expense for the `count` months ending at `endMonth`, oldest first. */
export function monthlyTrend(txs: Transaction[], endMonth: string, count: number) {
  const months = Array.from({ length: count }, (_, i) => shiftMonth(endMonth, i - count + 1));
  return months.map((month) => ({ month, ...summarize(inMonth(txs, month)) }));
}

/** Newest first: by date, then by creation time. */
export function sortTransactions(txs: Transaction[]): Transaction[] {
  return [...txs].sort((a, b) =>
    a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1,
  );
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(txs: Transaction[]): string {
  const header = 'Date,Type,Category,Method,Amount,Note';
  const rows = sortTransactions(txs).map((t) =>
    [t.date, t.type, t.category, t.method, (t.amount / 100).toFixed(2), t.note].map(csvCell).join(','),
  );
  return [header, ...rows].join('\n');
}
