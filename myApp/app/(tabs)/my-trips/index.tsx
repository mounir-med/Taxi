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
import { UserService, type Trip } from '@/lib/userService';

export default function UserMyTripsListScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [items, setItems] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const payload = await UserService.getMyTrips(token);
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
          Mes trajets
        </ThemedText>
        <Pressable onPress={load} style={[styles.refreshBtn, { borderColor: palette.icon }]} disabled={loading}>
          <ThemedText>{loading ? '...' : 'Rafraîchir'}</ThemedText>
        </Pressable>
      </View>

      {error ? <ThemedText style={{ color: '#c0392b' }}>{error}</ThemedText> : null}

      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator />
          </View>
        ) : null}

        {!loading && items.length === 0 ? <ThemedText style={{ opacity: 0.7 }}>Aucun trajet</ThemedText> : null}

        {items.map((t) => (
          <View key={String(t.id)} style={[styles.item, { borderColor: palette.icon, backgroundColor: palette.background }]}>
            <View style={styles.row}>
              <ThemedText type="defaultSemiBold">Trip ID</ThemedText>
              <ThemedText>{String(t.id)}</ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText type="defaultSemiBold">Statut</ThemedText>
              <ThemedText>{typeof (t as any).status === 'string' ? String((t as any).status) : '-'}</ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText type="defaultSemiBold">Chauffeur</ThemedText>
              <ThemedText>{t.driver && typeof t.driver.name === 'string' ? t.driver.name : '-'}</ThemedText>
            </View>

            <Pressable
              onPress={() => router.push({ pathname: '/(tabs)/my-trips/[tripId]', params: { tripId: String(t.id) } } as any)}
              style={[styles.actionBtn, { borderColor: palette.icon }]}
            >
              <ThemedText>Voir détail</ThemedText>
            </Pressable>
          </View>
        ))}
      </ScrollView>
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
  actionBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
});
