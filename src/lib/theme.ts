import { useColorScheme } from 'react-native';

const light = {
  background: '#F4F6F8',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#2563EB',
  onPrimary: '#FFFFFF',
  income: '#059669',
  expense: '#DC2626',
  incomeSoft: '#D1FAE5',
  expenseSoft: '#FEE2E2',
  chip: '#EEF2F7',
};

const dark: typeof light = {
  background: '#0B1220',
  card: '#151E2E',
  text: '#F3F4F6',
  muted: '#9CA3AF',
  border: '#263245',
  primary: '#60A5FA',
  onPrimary: '#0B1220',
  income: '#34D399',
  expense: '#F87171',
  incomeSoft: '#0F3B2E',
  expenseSoft: '#3F1D1D',
  chip: '#1E293B',
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
