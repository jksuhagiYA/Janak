import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Chip, SectionTitle } from '../components/ui';
import {
  amountToInput,
  CATEGORIES,
  dateLabel,
  fromDateKey,
  newId,
  parseAmount,
  PAYMENT_METHODS,
  shiftDateKey,
  toDateKey,
  type PaymentMethod,
  type TxType,
} from '../lib/finance';
import { useStore } from '../lib/store';
import { useColors } from '../lib/theme';

export default function TransactionScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { transactions, saveTransaction, deleteTransaction, settings } = useStore();
  const existing = id ? transactions.find((t) => t.id === id) : undefined;

  const [type, setType] = useState<TxType>(existing?.type ?? 'income');
  const [amount, setAmount] = useState(existing ? amountToInput(existing.amount) : '');
  const [category, setCategory] = useState(existing?.category ?? CATEGORIES.income[0]);
  const [method, setMethod] = useState<PaymentMethod>(existing?.method ?? 'cash');
  const [date, setDate] = useState(existing?.date ?? toDateKey(new Date()));
  const [note, setNote] = useState(existing?.note ?? '');
  const [showPicker, setShowPicker] = useState(false);

  const accent = type === 'income' ? c.income : c.expense;
  const parsed = parseAmount(amount);

  const switchType = (next: TxType) => {
    setType(next);
    if (!CATEGORIES[next].includes(category)) setCategory(CATEGORIES[next][0]);
  };

  const save = () => {
    if (parsed === null) {
      Alert.alert('Enter an amount', 'Please enter a valid amount greater than zero.');
      return;
    }
    saveTransaction({
      id: existing?.id ?? newId(),
      createdAt: existing?.createdAt ?? Date.now(),
      type,
      amount: parsed,
      category,
      method,
      date,
      note: note.trim(),
    });
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    const doDelete = () => {
      deleteTransaction(existing.id);
      router.back();
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('Delete this transaction?')) doDelete();
      return;
    }
    Alert.alert('Delete transaction?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: existing ? 'Edit transaction' : 'New transaction' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.segment, { backgroundColor: c.chip }]}>
          {(['income', 'expense'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => switchType(t)}
              style={[styles.segmentItem, type === t && { backgroundColor: t === 'income' ? c.income : c.expense }]}
            >
              <Text style={{ color: type === t ? c.onPrimary : c.text, fontWeight: '600' }}>
                {t === 'income' ? 'Income (money in)' : 'Expense (money out)'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.amountBox, { borderColor: accent, backgroundColor: c.card }]}>
          <Text style={[styles.currency, { color: accent }]}>{settings.currency}</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={c.muted}
            keyboardType="decimal-pad"
            autoFocus={!existing}
            style={[styles.amountInput, { color: c.text }]}
          />
        </View>
        {amount !== '' && parsed === null && <Text style={{ color: c.expense }}>Enter a number with up to 2 decimals.</Text>}

        <View>
          <SectionTitle>Category</SectionTitle>
          <View style={styles.chips}>
            {CATEGORIES[type].map((cat) => (
              <Chip key={cat} label={cat} color={accent} selected={category === cat} onPress={() => setCategory(cat)} />
            ))}
          </View>
        </View>

        <View>
          <SectionTitle>Paid via</SectionTitle>
          <View style={styles.chips}>
            {PAYMENT_METHODS.map((m) => (
              <Chip key={m.key} label={m.label} selected={method === m.key} onPress={() => setMethod(m.key)} />
            ))}
          </View>
        </View>

        <View>
          <SectionTitle>Date</SectionTitle>
          <View style={[styles.dateRow, { backgroundColor: c.card, borderColor: c.border }]}>
            <Pressable accessibilityLabel="Previous day" hitSlop={10} onPress={() => setDate((d) => shiftDateKey(d, -1))}>
              <Ionicons name="chevron-back" size={22} color={c.primary} />
            </Pressable>
            <Pressable onPress={() => Platform.OS !== 'web' && setShowPicker(true)} style={{ flex: 1 }}>
              <Text style={{ color: c.text, textAlign: 'center', fontSize: 16 }}>
                {date === toDateKey(new Date()) ? `Today, ${dateLabel(date)}` : dateLabel(date)}
              </Text>
            </Pressable>
            <Pressable accessibilityLabel="Next day" hitSlop={10} onPress={() => setDate((d) => shiftDateKey(d, 1))}>
              <Ionicons name="chevron-forward" size={22} color={c.primary} />
            </Pressable>
          </View>
          {showPicker && (
            <DateTimePicker
              value={fromDateKey(date)}
              mode="date"
              maximumDate={new Date()}
              onValueChange={(_e, selected) => {
                setShowPicker(Platform.OS === 'ios');
                if (selected) setDate(toDateKey(selected));
              }}
              onDismiss={() => setShowPicker(false)}
            />
          )}
        </View>

        <View>
          <SectionTitle>Note (optional)</SectionTitle>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Invoice #102, customer name"
            placeholderTextColor={c.muted}
            multiline
            style={[styles.note, { backgroundColor: c.card, color: c.text, borderColor: c.border }]}
          />
        </View>

        <Pressable
          onPress={save}
          style={({ pressed }) => [styles.saveButton, { backgroundColor: accent, opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={{ color: c.onPrimary, fontSize: 16, fontWeight: '700' }}>{existing ? 'Save changes' : 'Save'}</Text>
        </Pressable>

        {existing && (
          <Pressable onPress={remove} style={styles.deleteButton}>
            <Text style={{ color: c.expense, fontWeight: '600' }}>Delete transaction</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
  amountBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: 14, paddingHorizontal: 16 },
  currency: { fontSize: 28, fontWeight: '700', marginRight: 6 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: '700', paddingVertical: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
  },
  note: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: 12, minHeight: 70, fontSize: 15, textAlignVertical: 'top' },
  saveButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  deleteButton: { alignItems: 'center', paddingVertical: 8 },
});
