/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  balanceByMethod,
  byCategory,
  formatMoney,
  monthlyTrend,
  parseAmount,
  shiftMonth,
  sortTransactions,
  summarize,
  toCsv,
  type Transaction,
} from './finance.ts';

function tx(partial: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36),
    type: 'expense',
    amount: 100,
    category: 'Other',
    method: 'cash',
    date: '2026-09-01',
    note: '',
    createdAt: 0,
    ...partial,
  };
}

test('parseAmount accepts rupees and paise, rejects junk', () => {
  assert.equal(parseAmount('1,250.5'), 125050);
  assert.equal(parseAmount('99'), 9900);
  assert.equal(parseAmount('0.01'), 1);
  assert.equal(parseAmount('0'), null);
  assert.equal(parseAmount('12.345'), null);
  assert.equal(parseAmount('abc'), null);
  assert.equal(parseAmount(''), null);
});

test('formatMoney uses Indian grouping for rupees', () => {
  assert.equal(formatMoney(12345600, '₹'), '₹1,23,456');
  assert.equal(formatMoney(-150, '₹'), '-₹1.50');
  assert.equal(formatMoney(12345600, '$'), '$123,456');
  assert.equal(formatMoney(0, '₹'), '₹0');
});

test('summarize and balanceByMethod', () => {
  const txs = [
    tx({ type: 'income', amount: 10000, method: 'upi' }),
    tx({ type: 'expense', amount: 2500, method: 'cash' }),
    tx({ type: 'expense', amount: 500, method: 'upi' }),
  ];
  assert.deepEqual(summarize(txs), { income: 10000, expense: 3000, profit: 7000, count: 3 });
  assert.deepEqual(balanceByMethod(txs), { cash: -2500, bank: 0, upi: 9500, card: 0 });
});

test('byCategory sorts largest first with shares', () => {
  const txs = [
    tx({ category: 'Rent', amount: 3000 }),
    tx({ category: 'Food', amount: 1000 }),
    tx({ category: 'Rent', amount: 1000 }),
    tx({ type: 'income', category: 'Sales', amount: 99999 }),
  ];
  assert.deepEqual(byCategory(txs, 'expense'), [
    { category: 'Rent', total: 4000, share: 0.8 },
    { category: 'Food', total: 1000, share: 0.2 },
  ]);
});

test('shiftMonth crosses year boundaries', () => {
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
});

test('monthlyTrend returns oldest first', () => {
  const trend = monthlyTrend([tx({ date: '2026-08-15', type: 'income', amount: 500 })], '2026-09', 3);
  assert.deepEqual(
    trend.map((m) => [m.month, m.income]),
    [
      ['2026-07', 0],
      ['2026-08', 500],
      ['2026-09', 0],
    ],
  );
});

test('sortTransactions: newest date first, then newest created', () => {
  const a = tx({ id: 'a', date: '2026-09-01', createdAt: 1 });
  const b = tx({ id: 'b', date: '2026-09-02', createdAt: 0 });
  const c = tx({ id: 'c', date: '2026-09-01', createdAt: 5 });
  assert.deepEqual(sortTransactions([a, b, c]).map((t) => t.id), ['b', 'c', 'a']);
});

test('toCsv escapes commas and quotes', () => {
  const csv = toCsv([tx({ amount: 12050, note: 'Paid "Ravi", advance' })]);
  assert.equal(
    csv,
    'Date,Type,Category,Method,Amount,Note\n2026-09-01,expense,Other,cash,120.50,"Paid ""Ravi"", advance"',
  );
});
