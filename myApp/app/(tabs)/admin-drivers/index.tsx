import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import type { ApiError } from '@/lib/api';
import { AdminService, type AdminDriver } from '@/lib/adminService';

export default function AdminDriversListScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [items, setItems] = useState<AdminDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const payload = await AdminService.getDrivers(token);
      setItems(Array.isArray(payload) ? payload : []);
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Drivers
        </ThemedText>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/(tabs)/admin-drivers/create' as any)} style={[styles.actionBtn, { borderColor: palette.tint }]}>
            <ThemedText style={{ color: palette.tint }}>Créer</ThemedText>
          </Pressable>
          <Pressable onPress={load} style={[styles.actionBtn, { borderColor: palette.icon }]} disabled={loading}>
            <ThemedText>{loading ? '...' : 'Rafraîchir'}</ThemedText>
          </Pressable>
        </View>
      </View>

      {error ? <ThemedText style={{ color: '#c0392b' }}>{error}</ThemedText> : null}

      <View style={[styles.card, { borderColor: palette.icon, backgroundColor: palette.background, flex: 1 }]}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator />
          </View>
        ) : null}

        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
          {!loading && items.length === 0 ? <ThemedText style={{ opacity: 0.7 }}>Aucun driver</ThemedText> : null}

          {items.map((d) => (
            <View key={String(d.id)} style={[styles.item, { borderColor: palette.icon }]}>
              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Nom</ThemedText>
                <ThemedText>{typeof d.name === 'string' ? d.name : '-'}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Email</ThemedText>
                <ThemedText>{typeof d.email === 'string' ? d.email : '-'}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Status</ThemedText>
                <ThemedText>{typeof d.status === 'string' ? d.status : '-'}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Complaints</ThemedText>
                <ThemedText>{typeof d.complaintCount === 'number' ? String(d.complaintCount) : '-'}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Wallet</ThemedText>
                <ThemedText>{typeof d.wallet?.balance === 'number' ? String(d.wallet.balance) : '-'}</ThemedText>
              </View>

              <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/admin-drivers/[driverId]', params: { driverId: String(d.id) } } as any)}
                style={[styles.viewBtn, { borderColor: palette.icon }]}
              >
                <ThemedText>Voir</ThemedText>
              </Pressable>
            </View>
          ))}
        </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
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
  item: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  viewBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
});
