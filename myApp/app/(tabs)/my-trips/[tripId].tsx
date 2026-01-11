import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import type { ApiError } from '@/lib/api';
import { UserService, type Trip } from '@/lib/userService';

export default function UserTripDetailsScreen() {
  const { token } = useAuth();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const id = typeof tripId === 'string' ? tripId : '';

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setError(null);
    setLoading(true);
    try {
      const payload = await UserService.getTripDetails(id, token);
      setTrip(payload);
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Détail trajet
        </ThemedText>

        <View style={[styles.card, { borderColor: palette.icon, backgroundColor: palette.background }]}>
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <ActivityIndicator />
            </View>
          ) : null}

          {error ? <ThemedText style={{ color: '#c0392b' }}>{error}</ThemedText> : null}

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Trip ID</ThemedText>
            <ThemedText>{id || '-'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Statut</ThemedText>
            <ThemedText>{typeof (trip as any)?.status === 'string' ? String((trip as any).status) : '-'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Prix</ThemedText>
            <ThemedText>{(trip as any)?.price !== undefined ? String((trip as any).price) : '-'}</ThemedText>
          </View>

          <ThemedText type="defaultSemiBold" style={{ marginTop: 6 }}>
            Chauffeur
          </ThemedText>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Nom</ThemedText>
            <ThemedText>{trip?.driver && typeof trip.driver.name === 'string' ? trip.driver.name : '-'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Email</ThemedText>
            <ThemedText>{trip?.driver && typeof trip.driver.email === 'string' ? trip.driver.email : '-'}</ThemedText>
          </View>

          <Pressable onPress={load} style={[styles.secondaryBtn, { borderColor: palette.icon }]}>
            <ThemedText>Rafraîchir</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
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
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
});
