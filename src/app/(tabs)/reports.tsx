import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, MonthPicker, SectionTitle } from '../../components/ui';
import {
  byCategory,
  formatMoney,
  inMonth,
  monthLabel,
  monthlyTrend,
  shiftMonth,
  summarize,
  toDateKey,
  type Transaction,
  type TxType,
} from '../../lib/finance';
import { useStore } from '../../lib/store';
import { useColors } from '../../lib/theme';

export default function Reports() {
  const c = useColors();
  const { transactions, settings } = useStore();
  const [month, setMonth] = useState(() => toDateKey(new Date()).slice(0, 7));
  const currency = settings.currency;

  const monthTxs = inMonth(transactions, month);
  const totals = summarize(monthTxs);
  const trend = monthlyTrend(transactions, month, 6);
  const trendMax = Math.max(1, ...trend.flatMap((m) => [m.income, m.expense]));

  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      <MonthPicker month={month} onChange={(d) => setMonth((m) => shiftMonth(m, d))} />

      <Card>
        <Row label="Total income" value={formatMoney(totals.income, currency)} color={c.income} />
        <Row label="Total expense" value={formatMoney(totals.expense, currency)} color={c.expense} />
        <View style={[styles.divider, { backgroundColor: c.border }]} />
        <Row
          label={totals.profit >= 0 ? 'Net profit' : 'Net loss'}
          value={formatMoney(totals.profit, currency)}
          color={totals.profit >= 0 ? c.income : c.expense}
          bold
        />
        {totals.income > 0 && (
          <Text style={{ color: c.muted, marginTop: 6 }}>
            Profit margin: {((totals.profit / totals.income) * 100).toFixed(1)}%
          </Text>
        )}
      </Card>

      <View>
        <SectionTitle>Last 6 months</SectionTitle>
        <Card>
          <View style={styles.chart}>
            {trend.map((m) => (
              <View key={m.month} style={styles.chartCol}>
                <View style={styles.bars}>
                  <View style={[styles.bar, { height: `${(m.income / trendMax) * 100}%`, backgroundColor: c.income }]} />
                  <View style={[styles.bar, { height: `${(m.expense / trendMax) * 100}%`, backgroundColor: c.expense }]} />
                </View>
                <Text style={{ color: m.month === month ? c.text : c.muted, fontSize: 12, fontWeight: m.month === month ? '700' : '400' }}>
                  {monthLabel(m.month, true)}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <Legend color={c.income} label="Income" />
            <Legend color={c.expense} label="Expense" />
          </View>
        </Card>
      </View>

      <CategoryBreakdown title="Expenses by category" type="expense" txs={monthTxs} currency={currency} />
      <CategoryBreakdown title="Income by category" type="income" txs={monthTxs} currency={currency} />
    </ScrollView>
  );
}

function CategoryBreakdown({ title, type, txs, currency }: { title: string; type: TxType; txs: Transaction[]; currency: string }) {
  const c = useColors();
  const rows = byCategory(txs, type);
  const color = type === 'income' ? c.income : c.expense;
  return (
    <View>
      <SectionTitle>{title}</SectionTitle>
      <Card>
        {rows.length ? (
          rows.map((r) => (
            <View key={r.category} style={{ marginVertical: 6 }}>
              <View style={styles.catHeader}>
                <Text style={{ color: c.text, flex: 1 }} numberOfLines={1}>
                  {r.category}
                </Text>
                <Text style={{ color: c.muted, marginRight: 8 }}>{Math.round(r.share * 100)}%</Text>
                <Text style={{ color: c.text, fontWeight: '600' }}>{formatMoney(r.total, currency)}</Text>
              </View>
              <View style={[styles.track, { backgroundColor: c.chip }]}>
                <View style={[styles.fill, { width: `${r.share * 100}%`, backgroundColor: color }]} />
              </View>
            </View>
          ))
        ) : (
          <EmptyState text={`No ${type} recorded this month.`} />
        )}
      </Card>
    </View>
  );
}

function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  const c = useColors();
  return (
    <View style={styles.row}>
      <Text style={{ color: c.text, fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ color, fontWeight: bold ? '700' : '600', fontSize: bold ? 17 : 15 }}>{value}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
      <Text style={{ color: c.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  chart: { flexDirection: 'row', height: 150, alignItems: 'flex-end' },
  chartCol: { flex: 1, alignItems: 'center', gap: 6, height: '100%' },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 10, borderTopLeftRadius: 3, borderTopRightRadius: 3, minHeight: 1 },
  legend: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 12 },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
