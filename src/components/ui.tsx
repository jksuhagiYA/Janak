import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { dateLabel, formatMoney, monthLabel, PAYMENT_METHODS, type Transaction } from '../lib/finance';
import { useColors } from '../lib/theme';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const c = useColors();
  return <Text style={[styles.sectionTitle, { color: c.muted }]}>{children}</Text>;
}

export function MonthPicker({ month, onChange }: { month: string; onChange: (delta: number) => void }) {
  const c = useColors();
  return (
    <View style={styles.monthPicker}>
      <Pressable accessibilityLabel="Previous month" hitSlop={12} onPress={() => onChange(-1)}>
        <Ionicons name="chevron-back" size={22} color={c.primary} />
      </Pressable>
      <Text style={[styles.monthText, { color: c.text }]}>{monthLabel(month)}</Text>
      <Pressable accessibilityLabel="Next month" hitSlop={12} onPress={() => onChange(1)}>
        <Ionicons name="chevron-forward" size={22} color={c.primary} />
      </Pressable>
    </View>
  );
}

export function Chip({ label, selected, onPress, color }: { label: string; selected: boolean; onPress: () => void; color?: string }) {
  const c = useColors();
  const active = color ?? c.primary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, { backgroundColor: selected ? active : c.chip }]}
    >
      <Text style={{ color: selected ? c.onPrimary : c.text, fontWeight: selected ? '600' : '400' }}>{label}</Text>
    </Pressable>
  );
}

export function TransactionRow({ tx, currency, showDate = true }: { tx: Transaction; currency: string; showDate?: boolean }) {
  const c = useColors();
  const isIncome = tx.type === 'income';
  const method = PAYMENT_METHODS.find((m) => m.key === tx.method)?.label ?? tx.method;
  const subtitle = [showDate ? dateLabel(tx.date) : null, method, tx.note || null].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/transaction', params: { id: tx.id } })}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: isIncome ? c.incomeSoft : c.expenseSoft }]}>
        <Ionicons name={isIncome ? 'arrow-down' : 'arrow-up'} size={18} color={isIncome ? c.income : c.expense} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={1}>
          {tx.category}
        </Text>
        <Text style={{ color: c.muted, fontSize: 13 }} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Text style={[styles.rowAmount, { color: isIncome ? c.income : c.expense }]}>
        {isIncome ? '+' : '-'}
        {formatMoney(tx.amount, currency)}
      </Text>
    </Pressable>
  );
}

export function EmptyState({ text }: { text: string }) {
  const c = useColors();
  return <Text style={{ color: c.muted, textAlign: 'center', paddingVertical: 24 }}>{text}</Text>;
}

export function AddButton() {
  const c = useColors();
  return (
    <Pressable
      accessibilityLabel="Add transaction"
      onPress={() => router.push('/transaction')}
      style={({ pressed }) => [styles.fab, { backgroundColor: c.primary, opacity: pressed ? 0.8 : 1 }]}
    >
      <Ionicons name="add" size={30} color={c.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  monthPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 8 },
  monthText: { fontSize: 17, fontWeight: '600', minWidth: 110, textAlign: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '500' },
  rowAmount: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
