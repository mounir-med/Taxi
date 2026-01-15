import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { Collapsible } from '@/components/ui/collapsible';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import type { ApiError } from '@/lib/api';
import { AdminService, type AdminDriver, type DriverStatus } from '@/lib/adminService';

type StatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'BANNED';

export default function AdminDriversListScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [items, setItems] = useState<AdminDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    setSuccess(null);
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

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return items;
    return items.filter((d) => {
      const s = typeof d.status === 'string' ? d.status.toUpperCase() : '';
      return s === statusFilter;
    });
  }, [items, statusFilter]);

  const doStatusUpdate = useCallback(
    async (driverId: string, next: DriverStatus) => {
      if (!token) return;
      Alert.alert('Changer status', `Passer à ${next} ?`, [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          onPress: async () => {
            setError(null);
            setSuccess(null);
            setActionBusyId(driverId);
            try {
              await AdminService.updateDriverStatus(driverId, next, token);
              setSuccess('Status mis à jour');
              await load();
            } catch (e: any) {
              const apiErr = e as ApiError;
              setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Action impossible');
            } finally {
              setActionBusyId(null);
            }
          },
        },
      ]);
    },
    [load, token]
  );

  const doBan = useCallback(
    async (driverId: string) => {
      if (!token) return;
      Alert.alert('Ban', 'Bannir ce driver ?', [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            setError(null);
            setSuccess(null);
            setActionBusyId(driverId);
            try {
              await AdminService.banDriver(driverId, token);
              setSuccess('Driver banni');
              await load();
            } catch (e: any) {
              const apiErr = e as ApiError;
              setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Action impossible');
            } finally {
              setActionBusyId(null);
            }
          },
        },
      ]);
    },
    [load, token]
  );

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
          <Pressable onPress={load} style={[styles.actionBtn, { borderColor: palette.border, backgroundColor: palette.card }]} disabled={loading}>
            <ThemedText>{loading ? '...' : 'Rafraîchir'}</ThemedText>
          </Pressable>
        </View>
      </View>

      {error ? <ThemedText style={{ color: palette.danger }}>{error}</ThemedText> : null}
      {success ? <ThemedText style={{ color: palette.success }}>{success}</ThemedText> : null}

      <View style={[styles.filtersRow, { borderColor: palette.border, backgroundColor: palette.card }]}>
        {(['ALL', 'ACTIVE', 'PAUSED', 'BANNED'] as StatusFilter[]).map((s) => {
          const active = s === statusFilter;
          return (
            <Pressable
              key={s}
              onPress={() => setStatusFilter(s)}
              style={[
                styles.chip,
                {
                  borderColor: active ? palette.tint : palette.border,
                  backgroundColor: active ? 'rgba(24,119,242,0.14)' : palette.card,
                },
              ]}
            >
              <ThemedText style={{ color: active ? palette.tint : palette.text }}>{s}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card, flex: 1 }]}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator />
          </View>
        ) : null}

        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
          {!loading && filtered.length === 0 ? <ThemedText style={{ opacity: 0.7 }}>Aucun driver</ThemedText> : null}

          {filtered.map((d) => {
            const id = String(d.id);
            const status = typeof d.status === 'string' ? d.status : '-';
            const busy = actionBusyId === id;
            return (
              <View key={id} style={[styles.item, { borderColor: palette.border, backgroundColor: palette.card }]}>
                <View style={styles.topRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText type="defaultSemiBold">{typeof d.name === 'string' ? d.name : '—'}</ThemedText>
                    <ThemedText style={{ opacity: 0.75 }}>{typeof d.email === 'string' ? d.email : '-'}</ThemedText>
                  </View>
                  <View style={[styles.badge, { borderColor: palette.border, backgroundColor: palette.inputBackground }]}>
                    <ThemedText style={{ opacity: 0.9 }}>{status}</ThemedText>
                  </View>
                </View>

                <Collapsible title="Détails & actions">
                  <View style={{ gap: 10 }}>
                    <View style={styles.row}>
                      <ThemedText type="defaultSemiBold">Complaints</ThemedText>
                      <ThemedText>{typeof d.complaintCount === 'number' ? String(d.complaintCount) : '-'}</ThemedText>
                    </View>
                    <View style={styles.row}>
                      <ThemedText type="defaultSemiBold">Wallet</ThemedText>
                      <ThemedText>{typeof d.wallet?.balance === 'number' ? String(d.wallet.balance) : '-'}</ThemedText>
                    </View>

                    <View style={styles.chipsRow}>
                      <Pressable
                        onPress={() => router.push({ pathname: '/(tabs)/admin-drivers/[driverId]', params: { driverId: id } } as any)}
                        style={[styles.chip, { borderColor: palette.border, backgroundColor: palette.card }]}
                        disabled={busy}
                      >
                        <ThemedText>Voir</ThemedText>
                      </Pressable>

                      <Pressable
                        onPress={() => doStatusUpdate(id, 'ACTIVE')}
                        style={[styles.chip, { borderColor: palette.tint, backgroundColor: 'rgba(24,119,242,0.10)' }]}
                        disabled={busy}
                      >
                        <ThemedText style={{ color: palette.tint }}>ACTIVE</ThemedText>
                      </Pressable>

                      <Pressable
                        onPress={() => doStatusUpdate(id, 'PAUSED')}
                        style={[styles.chip, { borderColor: palette.border, backgroundColor: palette.inputBackground }]}
                        disabled={busy}
                      >
                        <ThemedText>PAUSE</ThemedText>
                      </Pressable>

                      <Pressable
                        onPress={() => doBan(id)}
                        style={[styles.chip, { borderColor: palette.danger, backgroundColor: 'rgba(228,30,63,0.08)' }]}
                        disabled={busy}
                      >
                        <ThemedText style={{ color: palette.danger }}>BAN</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </Collapsible>
              </View>
            );
          })}
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
  filtersRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
});
