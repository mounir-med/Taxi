import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import type { ApiError } from '@/lib/api';
import { UserService, type Driver } from '@/lib/userService';

export default function DriversScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [items, setItems] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const payload = await UserService.getAvailableDrivers(token);
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
      <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
        Chauffeurs disponibles
      </ThemedText>

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}>
        <Pressable onPress={load} disabled={loading} style={[styles.refreshBtn, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <ThemedText>{loading ? '...' : 'Rafraîchir'}</ThemedText>
        </Pressable>

        {loading ? (
          <View style={{ paddingVertical: 12, alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : null}

        {error ? <ThemedText style={{ color: palette.danger }}>{error}</ThemedText> : null}

        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
          {items.length === 0 && !loading ? <ThemedText style={{ opacity: 0.7 }}>Aucun chauffeur</ThemedText> : null}

          {items.map((d) => (
            <View key={String(d.id)} style={[styles.item, { borderColor: palette.border, backgroundColor: palette.card }]}
            >
              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Nom</ThemedText>
                <ThemedText>{typeof d.name === 'string' ? d.name : '-'}</ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Email</ThemedText>
                <ThemedText>{typeof d.email === 'string' ? d.email : '-'}</ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Véhicule</ThemedText>
                <ThemedText>{typeof d.vehicleInfo === 'string' ? d.vehicleInfo : '-'}</ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Rating</ThemedText>
                <ThemedText>{d.rating !== undefined ? String(d.rating) : '-'}</ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Statut</ThemedText>
                <ThemedText>{typeof d.status === 'string' ? d.status : '-'}</ThemedText>
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
    padding: 20,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    flex: 1,
  },
  refreshBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  item: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
});
