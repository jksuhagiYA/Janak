import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_SETTINGS, sortTransactions, type Settings, type Transaction } from './finance';

const TX_KEY = 'accounts/transactions/v1';
const SETTINGS_KEY = 'accounts/settings/v1';

interface Store {
  ready: boolean;
  transactions: Transaction[];
  settings: Settings;
  saveTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  clearAll: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      try {
        const [txRaw, settingsRaw] = await Promise.all([
          AsyncStorage.getItem(TX_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (txRaw) setTransactions(sortTransactions(JSON.parse(txRaw)));
        if (settingsRaw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(settingsRaw) });
      } catch (e) {
        console.warn('Failed to load saved data', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Persist after every change, but never before the initial load has finished
  // (otherwise the empty initial state would overwrite saved data).
  useEffect(() => {
    if (ready) AsyncStorage.setItem(TX_KEY, JSON.stringify(transactions)).catch(console.warn);
  }, [ready, transactions]);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(console.warn);
  }, [ready, settings]);

  const saveTransaction = useCallback((tx: Transaction) => {
    setTransactions((prev) => sortTransactions([...prev.filter((t) => t.id !== tx.id), tx]));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearAll = useCallback(() => setTransactions([]), []);

  const value = useMemo(
    () => ({ ready, transactions, settings, saveTransaction, deleteTransaction, updateSettings, clearAll }),
    [ready, transactions, settings, saveTransaction, deleteTransaction, updateSettings, clearAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}
