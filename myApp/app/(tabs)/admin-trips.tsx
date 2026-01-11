import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import type { ApiError } from '@/lib/api';
import { AdminService, type AdminTrip } from '@/lib/adminService';

export default function AdminTripsScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [items, setItems] = useState<AdminTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const payload = await AdminService.getTrips(token);
      setItems(Array.isArray(payload) ? payload : []);
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
          Trips (global)
        </ThemedText>
        <Pressable onPress={load} style={[styles.refreshBtn, { borderColor: palette.icon }]} disabled={loading}>
          <ThemedText>{loading ? '...' : 'Rafraîchir'}</ThemedText>
        </Pressable>
      </View>

      {error ? <ThemedText style={{ color: '#c0392b' }}>{error}</ThemedText> : null}

      <View style={[styles.card, { borderColor: palette.icon, backgroundColor: palette.background, flex: 1 }]}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator />
          </View>
        ) : null}

        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
          {!loading && items.length === 0 ? <ThemedText style={{ opacity: 0.7 }}>Aucun trajet</ThemedText> : null}

          {items.map((t) => (
            <View key={String(t.id)} style={[styles.item, { borderColor: palette.icon }]}>
              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Trip ID</ThemedText>
                <ThemedText>{String(t.id)}</ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Statut</ThemedText>
                <ThemedText>{typeof t.status === 'string' ? t.status : '-'}</ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Prix</ThemedText>
                <ThemedText>{typeof t.price === 'number' ? String(t.price) : String((t as any).finalPrice ?? '-')}</ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Driver</ThemedText>
                <ThemedText>
                  {t.driver && typeof t.driver.name === 'string'
                    ? t.driver.name
                    : t.driver && typeof t.driver.email === 'string'
                      ? t.driver.email
                      : '-'}
                </ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">User</ThemedText>
                <ThemedText>
                  {t.user && typeof t.user.name === 'string' ? t.user.name : t.user && typeof t.user.email === 'string' ? t.user.email : '-'}
                </ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Créé</ThemedText>
                <ThemedText>{t.createdAt ? String(t.createdAt) : '-'}</ThemedText>
              </View>
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
});
