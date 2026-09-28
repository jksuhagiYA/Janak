import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Chip, SectionTitle } from '../../components/ui';
import { toCsv } from '../../lib/finance';
import { useStore } from '../../lib/store';
import { useColors } from '../../lib/theme';

const CURRENCIES = ['₹', '$', '€', '£', 'AED ', '¥'];

function confirm(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

export default function Settings() {
  const c = useColors();
  const { settings, updateSettings, transactions, clearAll } = useStore();
  const [name, setName] = useState(settings.businessName);

  const exportCsv = async () => {
    try {
      await Share.share({ title: `${settings.businessName} transactions`, message: toCsv(transactions) });
    } catch (e) {
      Alert.alert('Export failed', String(e));
    }
  };

  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      <View>
        <SectionTitle>Business name</SectionTitle>
        <TextInput
          value={name}
          onChangeText={setName}
          onEndEditing={() => updateSettings({ businessName: name.trim() || 'My Business' })}
          onBlur={() => updateSettings({ businessName: name.trim() || 'My Business' })}
          style={[styles.input, { backgroundColor: c.card, color: c.text, borderColor: c.border }]}
        />
      </View>

      <View>
        <SectionTitle>Currency</SectionTitle>
        <View style={styles.chips}>
          {CURRENCIES.map((cur) => (
            <Chip key={cur} label={cur.trim()} selected={settings.currency === cur} onPress={() => updateSettings({ currency: cur })} />
          ))}
        </View>
      </View>

      <View>
        <SectionTitle>Data</SectionTitle>
        <Card style={{ gap: 12 }}>
          <Text style={{ color: c.muted }}>
            {transactions.length} transactions are stored on this device only. Export regularly to keep a backup.
          </Text>
          <Button label="Export as CSV" color={c.primary} onPress={exportCsv} disabled={!transactions.length} />
          <Button
            label="Delete all transactions"
            color={c.expense}
            disabled={!transactions.length}
            onPress={() =>
              confirm('Delete everything?', `This permanently removes all ${transactions.length} transactions.`, clearAll)
            }
          />
        </Card>
      </View>
    </ScrollView>
  );
}

function Button({ label, color, onPress, disabled }: { label: string; color: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, { borderColor: color, opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }]}
    >
      <Text style={{ color, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 24 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: 12, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
});
