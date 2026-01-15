import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import type { ApiError } from '@/lib/api';
import { AdminService, type AdminDriver, type DriverStatus } from '@/lib/adminService';

export default function AdminDriverDetailsScreen() {
  const { token } = useAuth();
  const { driverId } = useLocalSearchParams<{ driverId: string }>();

  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const id = typeof driverId === 'string' ? driverId : '';

  const [driver, setDriver] = useState<AdminDriver | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [nextStatus, setNextStatus] = useState<DriverStatus>('ACTIVE');
  const [pauseDays, setPauseDays] = useState('3');

  const load = useCallback(async () => {
    if (!token || !id) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const payload = await AdminService.getDriverById(id, token);
      setDriver(payload);
      const s = payload && typeof payload.status === 'string' ? payload.status.toUpperCase() : 'ACTIVE';
      if (s === 'ACTIVE' || s === 'PAUSED' || s === 'BANNED') {
        setNextStatus(s as DriverStatus);
      }
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

  const actionsDisabled = useMemo(() => !token || !id || loading, [id, loading, token]);

  const updateStatus = useCallback(async () => {
    if (!token || !id) return;
    Alert.alert('Update status', `Passer à ${nextStatus} ?`, [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui',
        onPress: async () => {
          setError(null);
          setSuccess(null);
          setLoading(true);
          try {
            await AdminService.updateDriverStatus(id, nextStatus, token);
            setSuccess('Status mis à jour');
            await load();
          } catch (e: any) {
            const apiErr = e as ApiError;
            setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Action impossible');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }, [id, load, nextStatus, token]);

  const ban = useCallback(async () => {
    if (!token || !id) return;
    Alert.alert('Ban', 'Bannir ce driver ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui',
        style: 'destructive',
        onPress: async () => {
          setError(null);
          setSuccess(null);
          setLoading(true);
          try {
            await AdminService.banDriver(id, token);
            setSuccess('Driver banni');
            await load();
          } catch (e: any) {
            const apiErr = e as ApiError;
            setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Action impossible');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }, [id, load, token]);

  const pause = useCallback(async () => {
    if (!token || !id) return;
    const days = Number(pauseDays);
    if (Number.isNaN(days) || days <= 0) {
      setError('Days invalide');
      return;
    }

    Alert.alert('Pause', `Mettre en pause ${days} jours ?`, [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui',
        onPress: async () => {
          setError(null);
          setSuccess(null);
          setLoading(true);
          try {
            await AdminService.pauseDriver(id, days, token);
            setSuccess('Driver en pause');
            await load();
          } catch (e: any) {
            const apiErr = e as ApiError;
            setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Action impossible');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }, [id, load, pauseDays, token]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Détail driver
        </ThemedText>

        <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}
        >
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <ActivityIndicator />
            </View>
          ) : null}

          {error ? <ThemedText style={{ color: palette.danger }}>{error}</ThemedText> : null}
          {success ? <ThemedText style={{ color: palette.success }}>{success}</ThemedText> : null}

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">ID</ThemedText>
            <ThemedText>{id || '-'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Nom</ThemedText>
            <ThemedText>{typeof driver?.name === 'string' ? driver?.name : '-'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Email</ThemedText>
            <ThemedText>{typeof driver?.email === 'string' ? driver?.email : '-'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Status</ThemedText>
            <ThemedText>{typeof driver?.status === 'string' ? driver?.status : '-'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Wallet</ThemedText>
            <ThemedText>{typeof driver?.wallet?.balance === 'number' ? String(driver?.wallet?.balance) : '-'}</ThemedText>
          </View>

          <ThemedText type="defaultSemiBold" style={{ marginTop: 10 }}>
            Actions
          </ThemedText>

          <ThemedText style={styles.label}>Status (ACTIVE/PAUSED/BANNED)</ThemedText>
          <TextInput
            value={nextStatus}
            onChangeText={(t) => setNextStatus((t.trim().toUpperCase() as DriverStatus) || 'ACTIVE')}
            placeholder="ACTIVE"
            placeholderTextColor={palette.muted}
            autoCapitalize="characters"
            style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]}
          />

          <Pressable onPress={updateStatus} disabled={actionsDisabled} style={[styles.secondaryBtn, { borderColor: palette.tint, opacity: actionsDisabled ? 0.6 : 1 }]}>
            <ThemedText style={{ color: palette.tint }}>Update status</ThemedText>
          </Pressable>

          <View style={styles.actionsRow}>
            <Pressable onPress={ban} disabled={actionsDisabled} style={[styles.actionBtn, { borderColor: palette.danger, opacity: actionsDisabled ? 0.6 : 1 }]}>
              <ThemedText style={{ color: palette.danger }}>Ban</ThemedText>
            </Pressable>

            <View style={{ flex: 1, gap: 8 }}>
              <TextInput
                value={pauseDays}
                onChangeText={setPauseDays}
                placeholder="days"
                placeholderTextColor={palette.muted}
                keyboardType="numeric"
                style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]}
              />
              <Pressable onPress={pause} disabled={actionsDisabled} style={[styles.actionBtn, { borderColor: palette.border, opacity: actionsDisabled ? 0.6 : 1 }]}>
                <ThemedText>Pause</ThemedText>
              </Pressable>
            </View>
          </View>

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
  label: {
    marginTop: 6,
    opacity: 0.8,
  },
  input: {
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
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
});
