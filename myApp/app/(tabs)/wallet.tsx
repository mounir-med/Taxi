import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import { apiRequest, type ApiError } from '@/lib/api';

type Wallet = {
  balance?: number;
  totalEarned?: number;
  totalTvaCollected?: number;
  updatedAt?: unknown;
  [key: string]: unknown;
};

export default function DriverWalletScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const payload = await apiRequest<Wallet>('/api/driver/wallet', { token });
      setWallet(payload);
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
        Wallet
      </ThemedText>

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator />
          </View>
        ) : null}

        {error ? <ThemedText style={{ color: palette.danger }}>{error}</ThemedText> : null}

        <View style={styles.row}>
          <ThemedText type="defaultSemiBold">Balance</ThemedText>
          <ThemedText>{typeof wallet?.balance === 'number' ? wallet.balance.toFixed(2) : '-'}</ThemedText>
        </View>

        <View style={styles.row}>
          <ThemedText type="defaultSemiBold">Total gagné</ThemedText>
          <ThemedText>{typeof wallet?.totalEarned === 'number' ? wallet.totalEarned.toFixed(2) : '-'}</ThemedText>
        </View>

        <View style={styles.row}>
          <ThemedText type="defaultSemiBold">TVA collectée</ThemedText>
          <ThemedText>{typeof wallet?.totalTvaCollected === 'number' ? wallet.totalTvaCollected.toFixed(2) : '-'}</ThemedText>
        </View>

        <View style={styles.row}>
          <ThemedText type="defaultSemiBold">Mis à jour</ThemedText>
          <ThemedText>{wallet?.updatedAt ? String(wallet.updatedAt) : '-'}</ThemedText>
        </View>

        <Pressable onPress={load} style={[styles.refreshBtn, { borderColor: palette.border }]}>
          <ThemedText>Rafraîchir</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  refreshBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
