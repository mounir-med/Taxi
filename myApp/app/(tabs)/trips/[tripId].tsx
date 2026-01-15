import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import { apiRequest, type ApiError } from '@/lib/api';

type Trip = {
  id?: string;
  status?: string;
  pickupAddress?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  destinationAddress?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  proposedPrice?: number;
  departureTime?: unknown;
  estimatedDuration?: number;
  availableSeats?: number;
  vehicleType?: string;
  expiresAt?: unknown;
  distance?: number;
  user?: any;
  finalPrice?: number;
  tvaAmount?: number;
  driverNetAmount?: number;
  [key: string]: unknown;
};

export default function DriverTripDetailsScreen() {
  const { token } = useAuth();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();

  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const id = typeof tripId === 'string' ? tripId : '';

  const load = useCallback(async () => {
    if (!token || !id) return;
    setError(null);
    setLoading(true);
    try {
      const payload = await apiRequest<Trip>(`/api/driver/trips/${id}`, { token });
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

  const status = typeof trip?.status === 'string' ? trip.status : '-';
  const canCancel = status === 'AVAILABLE';
  const canStart = status === 'ACCEPTED';
  const canComplete = status === 'STARTED';

  const actionButtons = useMemo(() => {
    const buttons: { key: string; label: string; action: 'cancel' | 'start' | 'complete'; destructive?: boolean }[] = [];
    if (canCancel) buttons.push({ key: 'cancel', label: 'Annuler', action: 'cancel', destructive: true });
    if (canStart) buttons.push({ key: 'start', label: 'Démarrer', action: 'start' });
    if (canComplete) buttons.push({ key: 'complete', label: 'Terminer', action: 'complete' });
    return buttons;
  }, [canCancel, canComplete, canStart]);

  const doAction = useCallback(
    async (action: 'cancel' | 'start' | 'complete') => {
      if (!token || !id) return;

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

              const payload = await apiRequest<any>(endpoint, { method: 'POST', token, body: { tripId: id } });

              if (action === 'complete') {
                router.replace({ pathname: '/(tabs)/trips/receipt', params: { ...payload } } as any);
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
    [id, load, token]
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Détail trajet
        </ThemedText>

        <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}>
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <ActivityIndicator />
            </View>
          ) : null}

          {error ? <ThemedText style={{ color: palette.danger }}>{error}</ThemedText> : null}

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Statut</ThemedText>
            <ThemedText>{status}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Trip ID</ThemedText>
            <ThemedText>{id || '-'}</ThemedText>
          </View>

          <ThemedText type="defaultSemiBold" style={{ marginTop: 6 }}>
            Trajet
          </ThemedText>
          <ThemedText style={{ opacity: 0.9 }}>
            {typeof trip?.pickupAddress === 'string' ? trip.pickupAddress : '-'} →{' '}
            {typeof trip?.destinationAddress === 'string' ? trip.destinationAddress : '-'}
          </ThemedText>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Prix proposé</ThemedText>
            <ThemedText>{typeof trip?.proposedPrice === 'number' ? trip.proposedPrice : '-'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Distance</ThemedText>
            <ThemedText>{typeof trip?.distance === 'number' ? trip.distance.toFixed(2) : '-'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Départ</ThemedText>
            <ThemedText>{trip?.departureTime ? String(trip.departureTime) : '-'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Expire</ThemedText>
            <ThemedText>{trip?.expiresAt ? String(trip.expiresAt) : '-'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Véhicule</ThemedText>
            <ThemedText>{typeof trip?.vehicleType === 'string' ? trip.vehicleType : '-'}</ThemedText>
          </View>

          <ThemedText type="defaultSemiBold" style={{ marginTop: 6 }}>
            User
          </ThemedText>
          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Email</ThemedText>
            <ThemedText>{trip?.user && typeof trip.user.email === 'string' ? trip.user.email : '-'}</ThemedText>
          </View>

          {actionButtons.length > 0 ? (
            <View style={styles.actionsRow}>
              {actionButtons.map((b) => (
                <Pressable
                  key={b.key}
                  onPress={() => doAction(b.action)}
                  style={[styles.actionBtn, { borderColor: b.destructive ? palette.danger : palette.tint }]}
                >
                  <ThemedText style={{ color: b.destructive ? palette.danger : palette.tint }}>{b.label}</ThemedText>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Pressable onPress={load} style={[styles.secondaryBtn, { borderColor: palette.border, backgroundColor: palette.card }]}>
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
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
});
