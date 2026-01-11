import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import type { ApiError } from '@/lib/api';
import { AdminService, type AdminWallet } from '@/lib/adminService';

export default function AdminWalletScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [wallet, setWallet] = useState<AdminWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const payload = await AdminService.getWallet(token);
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
      <View style={styles.headerRow}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Wallet Admin
        </ThemedText>
        <Pressable onPress={load} style={[styles.refreshBtn, { borderColor: palette.icon }]} disabled={loading}>
          <ThemedText>{loading ? '...' : 'Rafraîchir'}</ThemedText>
        </Pressable>
      </View>

      <View style={[styles.card, { borderColor: palette.icon, backgroundColor: palette.background }]}
      >
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator />
          </View>
        ) : null}

        {error ? <ThemedText style={{ color: '#c0392b' }}>{error}</ThemedText> : null}

        <View style={styles.row}>
          <ThemedText type="defaultSemiBold">Balance</ThemedText>
          <ThemedText>{wallet && typeof wallet.balance === 'number' ? String(wallet.balance) : '-'}</ThemedText>
        </View>

        <View style={styles.row}>
          <ThemedText type="defaultSemiBold">TVA collectée</ThemedText>
          <ThemedText>
            {wallet && typeof wallet.totalTvaCollected === 'number' ? String(wallet.totalTvaCollected) : '-'}
          </ThemedText>
        </View>

        <View style={styles.row}>
          <ThemedText type="defaultSemiBold">Updated</ThemedText>
          <ThemedText>{wallet?.updatedAt ? String(wallet.updatedAt) : '-'}</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  refreshBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
});
