import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import type { ApiError } from '@/lib/api';
import { UserService, type Trip, type TripFilters } from '@/lib/userService';

const Logo = require('@/assets/images/logo.png');

export default function AvailableTripsScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [items, setItems] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [availableSeats, setAvailableSeats] = useState('');

  const filters = useMemo<TripFilters>(() => {
    const next: TripFilters = {};
    if (minPrice.trim()) {
      const v = Number(minPrice);
      if (!Number.isNaN(v)) next.minPrice = v;
    }
    if (maxPrice.trim()) {
      const v = Number(maxPrice);
      if (!Number.isNaN(v)) next.maxPrice = v;
    }
    if (vehicleType.trim()) {
      next.vehicleType = vehicleType.trim();
    }
    if (availableSeats.trim()) {
      const v = Number(availableSeats);
      if (!Number.isNaN(v)) next.availableSeats = v;
    }
    return next;
  }, [availableSeats, maxPrice, minPrice, vehicleType]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = await UserService.getAvailableTrips(token, filters);
      setItems(Array.isArray(payload) ? payload : []);
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const accept = useCallback(
    async (tripId: string) => {
      if (!token) return;
      setError(null);
      setSuccess(null);
      try {
        await UserService.acceptTrip(tripId, token);
        setSuccess('Trajet accepté');
        await load();
      } catch (e: any) {
        const apiErr = e as ApiError;
        if (apiErr?.status === 404) {
          setError('Trip not available or expired');
        } else {
          setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Action impossible');
        }
      }
    },
    [load, token]
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <Image source={Logo} style={styles.logo} resizeMode="contain" />
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Trajets disponibles
        </ThemedText>
      </View>

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}>
        <ThemedText type="defaultSemiBold">Filtres</ThemedText>

        <View style={styles.filtersRow}>
          <View style={styles.filterCol}>
            <ThemedText style={styles.label}>Min prix</ThemedText>
            <TextInput
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
              placeholder="ex: 50"
              placeholderTextColor={palette.muted}
              style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]}
            />
          </View>
          <View style={styles.filterCol}>
            <ThemedText style={styles.label}>Max prix</ThemedText>
            <TextInput
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
              placeholder="ex: 200"
              placeholderTextColor={palette.muted}
              style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]}
            />
          </View>
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.filterCol}>
            <ThemedText style={styles.label}>Véhicule</ThemedText>
            <TextInput
              value={vehicleType}
              onChangeText={setVehicleType}
              placeholder="ex: SEDAN"
              placeholderTextColor={palette.muted}
              autoCapitalize="characters"
              style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]}
            />
          </View>
          <View style={styles.filterCol}>
            <ThemedText style={styles.label}>Places min</ThemedText>
            <TextInput
              value={availableSeats}
              onChangeText={setAvailableSeats}
              keyboardType="numeric"
              placeholder="ex: 2"
              placeholderTextColor={palette.muted}
              style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]}
            />
          </View>
        </View>

        <Pressable onPress={load} disabled={loading} style={[styles.refreshBtn, { borderColor: palette.border }]}>
          <ThemedText>{loading ? '...' : 'Appliquer & rafraîchir'}</ThemedText>
        </Pressable>

        {error ? <ThemedText style={{ color: palette.danger }}>{error}</ThemedText> : null}
        {success ? <ThemedText style={{ color: palette.success }}>{success}</ThemedText> : null}
      </View>

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card, flex: 1 }]}>
        {loading ? (
          <View style={{ paddingVertical: 12, alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : null}

        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
          {items.length === 0 && !loading ? <ThemedText style={{ opacity: 0.7 }}>Aucun trajet</ThemedText> : null}

          {items.map((t) => (
            <View key={String(t.id)} style={[styles.item, { borderColor: palette.border, backgroundColor: palette.card }]}>
              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Prix</ThemedText>
                <ThemedText>{String((t as any).price ?? '-')}</ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Véhicule</ThemedText>
                <ThemedText>{String((t as any).vehicleType ?? '-')}</ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Places</ThemedText>
                <ThemedText>{String((t as any).availableSeats ?? '-')}</ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Chauffeur</ThemedText>
                <ThemedText>{t.driver && typeof t.driver.name === 'string' ? t.driver.name : '-'}</ThemedText>
              </View>

              <Pressable onPress={() => accept(String(t.id))} style={[styles.primaryBtn, { backgroundColor: palette.tint }]}>
                <ThemedText style={{ color: '#fff' }}>Accepter</ThemedText>
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
    padding: 20,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterCol: {
    flex: 1,
    gap: 6,
  },
  label: {
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
});
