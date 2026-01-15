import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import { apiRequest, type ApiError } from '@/lib/api';

type Trip = {
  id: string;
  status?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  proposedPrice?: number;
  departureTime?: unknown;
  distance?: number;
  user?: any;
  [key: string]: unknown;
};

export default function DriverTripsListScreen() {
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
      const payload = await apiRequest<Trip[]>('/api/driver/trips', { token });
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

  const doAction = useCallback(
    async (tripId: string, action: 'cancel' | 'start' | 'complete') => {
      if (!token) return;

      const label = action === 'cancel' ? 'Annuler' : action === 'start' ? 'Démarrer' : 'Terminer';
      Alert.alert(label, 'Confirmer ?', [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: action === 'cancel' ? 'destructive' : 'default',
          onPress: async () => {
            setError(null);
            try {
              const endpoint =
                action === 'cancel'
                  ? '/api/driver/trips/cancel'
                  : action === 'start'
                    ? '/api/driver/trips/start'
                    : '/api/driver/trips/complete';

              const payload = await apiRequest<any>(endpoint, { method: 'POST', token, body: { tripId } });

              if (action === 'complete') {
                router.push({ pathname: '/(tabs)/trips/receipt', params: { ...payload } } as any);
                return;
              }

              void load();
            } catch (e: any) {
              const apiErr = e as ApiError;
              setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Action impossible');
            }
          },
        },
      ]);
    },
    [load, token]
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Mes trajets
        </ThemedText>
        <Pressable onPress={load} style={[styles.refreshBtn, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <ThemedText>Rafraîchir</ThemedText>
        </Pressable>
      </View>

      {error ? <ThemedText style={{ color: palette.danger }}>{error}</ThemedText> : null}

      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator />
          </View>
        ) : null}

        {!loading && items.length === 0 ? <ThemedText style={{ opacity: 0.7 }}>Aucun trajet</ThemedText> : null}

        {items.map((t) => {
          const status = typeof t.status === 'string' ? t.status : '-';
          const canCancel = status === 'AVAILABLE';
          const canStart = status === 'ACCEPTED';
          const canComplete = status === 'STARTED';

          return (
            <View key={t.id} style={[styles.item, { borderColor: palette.border, backgroundColor: palette.card }]}>
              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Statut</ThemedText>
                <ThemedText>{status}</ThemedText>
              </View>

              <ThemedText style={{ opacity: 0.9 }}>
                {typeof t.pickupAddress === 'string' ? t.pickupAddress : '-'} →{' '}
                {typeof t.destinationAddress === 'string' ? t.destinationAddress : '-'}
              </ThemedText>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Prix</ThemedText>
                <ThemedText>{typeof t.proposedPrice === 'number' ? t.proposedPrice : '-'}</ThemedText>
              </View>

              <View style={styles.actionsRow}>
                {canCancel ? (
                  <Pressable onPress={() => doAction(t.id, 'cancel')} style={[styles.actionBtn, { borderColor: palette.danger }]}>
                    <ThemedText style={{ color: palette.danger }}>Annuler</ThemedText>
                  </Pressable>
                ) : null}

                {canStart ? (
                  <Pressable onPress={() => doAction(t.id, 'start')} style={[styles.actionBtn, { borderColor: palette.tint }]}>
                    <ThemedText style={{ color: palette.tint }}>Démarrer</ThemedText>
                  </Pressable>
                ) : null}

                {canComplete ? (
                  <Pressable onPress={() => doAction(t.id, 'complete')} style={[styles.actionBtn, { borderColor: palette.tint }]}>
                    <ThemedText style={{ color: palette.tint }}>Terminer</ThemedText>
                  </Pressable>
                ) : null}

                <Pressable
                  onPress={() => router.push({ pathname: '/(tabs)/trips/[tripId]', params: { tripId: t.id } } as any)}
                  style={[styles.actionBtn, { borderColor: palette.border, backgroundColor: palette.card }]}
                >
                  <ThemedText>Voir</ThemedText>
                </Pressable>
              </View>
            </View>
          );
        })}
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
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
