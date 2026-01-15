import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import type { ApiError } from '@/lib/api';
import { AdminService } from '@/lib/adminService';

const Logo = require('@/assets/images/logo.png');

function readNumber(obj: any, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return null;
}

export default function AdminDashboardScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const payload = await AdminService.getStats(token);
      setStats(payload);
    } catch (e: any) {
      const apiErr = e as ApiError;
      if (apiErr?.status === 404) {
        try {
          const payload = await AdminService.getStatistics(token);
          setStats(payload);
        } catch (e2: any) {
          const apiErr2 = e2 as ApiError;
          setError(typeof apiErr2?.message === 'string' ? apiErr2.message : 'Chargement impossible');
        }
      } else {
        setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Chargement impossible');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = useMemo(() => {
    const s = stats;
    return [
      { label: 'Drivers', value: readNumber(s, ['totalDrivers', 'drivers', 'driversCount', 'driverCount']) },
      { label: 'Users', value: readNumber(s, ['totalUsers', 'users', 'usersCount', 'userCount']) },
      { label: 'Trips', value: readNumber(s, ['totalTrips', 'trips', 'tripsCount', 'tripCount']) },
      { label: 'Complaints', value: readNumber(s, ['totalComplaints', 'complaints', 'complaintsCount', 'complaintCount']) },
      { label: 'Revenue', value: readNumber(s, ['revenue', 'totalRevenue', 'totalAmount']) },
      { label: 'TVA', value: readNumber(s, ['tva', 'totalTva', 'tvaCollected', 'totalTvaCollected']) },
    ];
  }, [stats]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <Image source={Logo} style={styles.logo} resizeMode="contain" />
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded, flex: 1 }}>
          Admin Dashboard
        </ThemedText>
        <Pressable onPress={load} style={[styles.refreshBtn, { borderColor: palette.border, backgroundColor: palette.card }]} disabled={loading}>
          <ThemedText>{loading ? '...' : 'Rafraîchir'}</ThemedText>
        </Pressable>
      </View>

      {error ? <ThemedText style={{ color: palette.danger }}>{error}</ThemedText> : null}

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}
      >
        <ThemedText type="defaultSemiBold">KPI</ThemedText>
        <View style={styles.kpiGrid}>
          {cards.map((c) => (
            <View key={c.label} style={[styles.kpiItem, { borderColor: palette.border, backgroundColor: palette.inputBackground }]}>
              <ThemedText style={{ opacity: 0.8 }}>{c.label}</ThemedText>
              <ThemedText type="subtitle">{typeof c.value === 'number' ? String(c.value) : '-'}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card, flex: 1 }]}
      >
        <ThemedText type="defaultSemiBold">Réponse brute</ThemedText>

        {loading ? (
          <View style={{ paddingVertical: 12, alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : null}

        <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
          <ThemedText style={{ fontFamily: Fonts.mono, opacity: 0.9 }}>
            {stats ? JSON.stringify(stats, null, 2) : '—'}
          </ThemedText>
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
  logo: {
    width: 40,
    height: 40,
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minWidth: 110,
    gap: 6,
  },
});
