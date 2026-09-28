import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AddButton, Card, EmptyState, SectionTitle, TransactionRow } from '../../components/ui';
import {
  balanceByMethod,
  formatMoney,
  inMonth,
  monthLabel,
  PAYMENT_METHODS,
  summarize,
  toDateKey,
} from '../../lib/finance';
import { useStore } from '../../lib/store';
import { useColors } from '../../lib/theme';

export default function Dashboard() {
  const c = useColors();
  const { ready, transactions, settings } = useStore();

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const currency = settings.currency;
  const thisMonth = toDateKey(new Date()).slice(0, 7);
  const month = summarize(inMonth(transactions, thisMonth));
  const allTime = summarize(transactions);
  const balances = balanceByMethod(transactions);
  const recent = transactions.slice(0, 6);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.business, { color: c.text }]}>{settings.businessName}</Text>

        <Card style={{ backgroundColor: c.primary, borderColor: c.primary }}>
          <Text style={{ color: c.onPrimary, opacity: 0.85 }}>Net balance (all time)</Text>
          <Text style={[styles.balance, { color: c.onPrimary }]}>{formatMoney(allTime.profit, currency)}</Text>
          <Text style={{ color: c.onPrimary, opacity: 0.85 }}>{allTime.count} transactions recorded</Text>
        </Card>

        <View>
          <SectionTitle>{monthLabel(thisMonth)}</SectionTitle>
          <View style={styles.statRow}>
            <Stat label="Income" value={formatMoney(month.income, currency)} color={c.income} />
            <Stat label="Expense" value={formatMoney(month.expense, currency)} color={c.expense} />
          </View>
          <Card style={{ marginTop: 12 }}>
            <Text style={{ color: c.muted }}>{month.profit >= 0 ? 'Profit this month' : 'Loss this month'}</Text>
            <Text style={[styles.statValue, { color: month.profit >= 0 ? c.income : c.expense }]}>
              {formatMoney(month.profit, currency)}
            </Text>
          </Card>
        </View>

        <View>
          <SectionTitle>Balance by account</SectionTitle>
          <Card>
            {PAYMENT_METHODS.map((m) => (
              <View key={m.key} style={styles.methodRow}>
                <Text style={{ color: c.text }}>{m.label}</Text>
                <Text style={{ color: balances[m.key] < 0 ? c.expense : c.text, fontWeight: '600' }}>
                  {formatMoney(balances[m.key], currency)}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        <View>
          <SectionTitle>Recent transactions</SectionTitle>
          <Card style={{ paddingVertical: 6 }}>
            {recent.length ? (
              recent.map((t) => <TransactionRow key={t.id} tx={t} currency={currency} />)
            ) : (
              <EmptyState text="No transactions yet. Tap + to add your first sale or expense." />
            )}
          </Card>
        </View>
      </ScrollView>
      <AddButton />
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  const c = useColors();
  return (
    <Card style={{ flex: 1 }}>
      <Text style={{ color: c.muted }}>{label}</Text>
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 20, paddingBottom: 100 },
  business: { fontSize: 22, fontWeight: '700' },
  balance: { fontSize: 32, fontWeight: '700', marginVertical: 6, fontVariant: ['tabular-nums'] },
  statRow: { flexDirection: 'row', gap: 12 },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 4, fontVariant: ['tabular-nums'] },
  methodRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
});
