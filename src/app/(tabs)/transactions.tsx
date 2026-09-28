import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { AddButton, Chip, EmptyState, MonthPicker, TransactionRow } from '../../components/ui';
import { dateLabel, formatMoney, inMonth, shiftMonth, summarize, toDateKey, type Transaction } from '../../lib/finance';
import { useStore } from '../../lib/store';
import { useColors } from '../../lib/theme';

type Filter = 'all' | 'income' | 'expense';

export default function Transactions() {
  const c = useColors();
  const { transactions, settings } = useStore();
  const [month, setMonth] = useState(() => toDateKey(new Date()).slice(0, 7));
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inMonth(transactions, month).filter(
      (t) =>
        (filter === 'all' || t.type === filter) &&
        (!q || t.category.toLowerCase().includes(q) || t.note.toLowerCase().includes(q)),
    );
  }, [transactions, month, filter, query]);

  // Transactions are already sorted newest-first, so grouping preserves order.
  const sections = useMemo(() => {
    const groups: { title: string; data: Transaction[] }[] = [];
    for (const t of visible) {
      const last = groups[groups.length - 1];
      if (last?.title === t.date) last.data.push(t);
      else groups.push({ title: t.date, data: [t] });
    }
    return groups;
  }, [visible]);

  const totals = summarize(visible);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.header, { backgroundColor: c.card, borderColor: c.border }]}>
        <MonthPicker month={month} onChange={(d) => setMonth((m) => shiftMonth(m, d))} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search category or note"
          placeholderTextColor={c.muted}
          style={[styles.search, { backgroundColor: c.chip, color: c.text }]}
        />
        <View style={styles.chips}>
          <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="Income" selected={filter === 'income'} color={c.income} onPress={() => setFilter('income')} />
          <Chip label="Expense" selected={filter === 'expense'} color={c.expense} onPress={() => setFilter('expense')} />
        </View>
        <View style={styles.totals}>
          <Text style={{ color: c.income }}>In {formatMoney(totals.income, settings.currency)}</Text>
          <Text style={{ color: c.expense }}>Out {formatMoney(totals.expense, settings.currency)}</Text>
          <Text style={{ color: c.text, fontWeight: '600' }}>Net {formatMoney(totals.profit, settings.currency)}</Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.dateHeader, { color: c.muted }]}>{dateLabel(section.title)}</Text>
        )}
        renderItem={({ item }) => <TransactionRow tx={item} currency={settings.currency} showDate={false} />}
        ListEmptyComponent={<EmptyState text="No transactions for this month." />}
      />
      <AddButton />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 12, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  search: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  chips: { flexDirection: 'row', gap: 8 },
  totals: { flexDirection: 'row', justifyContent: 'space-between' },
  dateHeader: { fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 2 },
});
