import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import { apiRequest, type ApiError } from '@/lib/api';

type WalletDto = {
  balance?: number;
  totalEarned?: number;
  totalTvaCollected?: number;
};

type TripDto = {
  id: string;
  status?: string;
};

export default function DriverDashboardScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [trips, setTrips] = useState<TripDto[]>([]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of trips) {
      const s = (t.status ?? 'UNKNOWN').toUpperCase();
      counts[s] = (counts[s] ?? 0) + 1;
    }

    const total = trips.length;
    const completed = counts.COMPLETED ?? 0;
    const started = counts.STARTED ?? 0;
    const accepted = counts.ACCEPTED ?? 0;
    const available = counts.AVAILABLE ?? 0;

    return { total, completed, started, accepted, available };
  }, [trips]);

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [walletRes, tripsRes] = await Promise.all([
        apiRequest('/api/driver/wallet', { method: 'GET', token }),
        apiRequest('/api/driver/trips', { method: 'GET', token }),
      ]);

      setWallet(walletRes as WalletDto);
      setTrips(Array.isArray(tripsRes) ? (tripsRes as TripDto[]) : []);
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.headerRow}>
        <ThemedText type="title">Dashboard</ThemedText>
        <Pressable
          onPress={loadAll}
          style={[styles.refreshBtn, { borderColor: palette.icon }]}
          disabled={loading}
        >
          <ThemedText style={{ color: palette.text }}>{loading ? '...' : 'Rafraîchir'}</ThemedText>
        </Pressable>
      </ThemedView>

      {error ? (
        <ThemedText style={{ color: 'red', marginBottom: 12 }}>{error}</ThemedText>
      ) : null}

      {loading && !wallet && trips.length === 0 ? (
        <View style={{ paddingVertical: 24 }}>
          <ActivityIndicator />
        </View>
      ) : null}

      <ThemedView style={[styles.card, { borderColor: palette.icon }]}
      >
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
          Wallet
        </ThemedText>
        <ThemedView style={styles.kpisRow}>
          <Kpi label="Solde" value={String(wallet?.balance ?? 0)} />
          <Kpi label="Gains" value={String(wallet?.totalEarned ?? 0)} />
          <Kpi label="TVA" value={String(wallet?.totalTvaCollected ?? 0)} />
        </ThemedView>
        <Pressable
          onPress={() => router.push('/(tabs)/wallet' as any)}
          style={[styles.primaryBtn, { backgroundColor: palette.tint }]}
        >
          <ThemedText style={{ color: '#fff' }}>Voir wallet</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={[styles.card, { borderColor: palette.icon }]}
      >
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
          Trajets
        </ThemedText>
        <ThemedView style={styles.kpisRow}>
          <Kpi label="Total" value={String(stats.total)} />
          <Kpi label="Disponibles" value={String(stats.available)} />
          <Kpi label="Acceptés" value={String(stats.accepted)} />
        </ThemedView>
        <ThemedView style={[styles.kpisRow, { marginTop: 12 }]}
        >
          <Kpi label="Démarrés" value={String(stats.started)} />
          <Kpi label="Terminés" value={String(stats.completed)} />
          <Kpi label="" value="" />
        </ThemedView>

        <ThemedView style={styles.actionsRow}>
          <Pressable
            onPress={() => router.push('/(tabs)/create-trip' as any)}
            style={[styles.secondaryBtn, { borderColor: palette.icon }]}
          >
            <ThemedText style={{ color: palette.text }}>Créer un trajet</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/trips' as any)}
            style={[styles.secondaryBtn, { borderColor: palette.icon }]}
          >
            <ThemedText style={{ color: palette.text }}>Mes trajets</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.quickLinksRow}>
        <Pressable
          onPress={() => router.push('/(tabs)/complaints' as any)}
          style={[styles.linkBtn, { borderColor: palette.icon }]}
        >
          <ThemedText style={{ color: palette.text }}>Réclamations</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(tabs)/location' as any)}
          style={[styles.linkBtn, { borderColor: palette.icon }]}
        >
          <ThemedText style={{ color: palette.text }}>Localisation</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(tabs)/account' as any)}
          style={[styles.linkBtn, { borderColor: palette.icon }]}
        >
          <ThemedText style={{ color: palette.text }}>Compte</ThemedText>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.kpiBox}>
      <ThemedText style={styles.kpiLabel}>{label}</ThemedText>
      <ThemedText type="title" style={styles.kpiValue}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  cardTitle: {
    marginBottom: 6,
  },
  kpisRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  kpiLabel: {
    opacity: 0.7,
  },
  kpiValue: {
    fontSize: 20,
  },
  primaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: 10,
  },
  linkBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
