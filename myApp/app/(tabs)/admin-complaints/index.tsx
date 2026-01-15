import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { Collapsible } from '@/components/ui/collapsible';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import type { ApiError } from '@/lib/api';
import { AdminService, type AdminComplaint, type ComplaintProcessAction } from '@/lib/adminService';

type StatusChip = 'ALL' | 'PENDING' | 'RESOLVED' | 'REJECTED' | 'ESCALATED';

export default function AdminComplaintsListScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [items, setItems] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [statusChip, setStatusChip] = useState<StatusChip>('ALL');

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const payload = await AdminService.getComplaints(token);
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

  const filtered = useMemo(() => {
    const text = statusFilter.trim().toUpperCase();
    const chip = statusChip;

    return items.filter((c) => {
      const s = typeof c.status === 'string' ? c.status.toUpperCase() : '';
      const message = typeof c.message === 'string' ? c.message.toUpperCase() : '';

      const chipOk = chip === 'ALL' ? true : s === chip;
      const textOk = text.length === 0 ? true : s.includes(text) || message.includes(text);

      return chipOk && textOk;
    });
  }, [items, statusChip, statusFilter]);

  const process = useCallback(
    async (complaintId: string, action: ComplaintProcessAction) => {
      if (!token) return;
      Alert.alert('Traiter', `Action: ${action} ?`, [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          onPress: async () => {
            setError(null);
            setSuccess(null);
            setActionBusyId(complaintId);
            try {
              await AdminService.processComplaint(complaintId, action, token);
              setSuccess(`Action envoyée: ${action}`);
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

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Réclamations
        </ThemedText>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/(tabs)/admin-complaints/stats' as any)} style={[styles.actionBtn, { borderColor: palette.tint }]}>
            <ThemedText style={{ color: palette.tint }}>Stats</ThemedText>
          </Pressable>
          <Pressable onPress={load} style={[styles.actionBtn, { borderColor: palette.border, backgroundColor: palette.card }]} disabled={loading}>
            <ThemedText>{loading ? '...' : 'Rafraîchir'}</ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}
      >
        <ThemedText type="defaultSemiBold">Filtre status</ThemedText>
        <TextInput
          value={statusFilter}
          onChangeText={setStatusFilter}
          placeholder="PENDING / RESOLVED ..."
          placeholderTextColor={palette.muted}
          autoCapitalize="characters"
          style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]}
        />

        <View style={styles.chipsRow}>
          {(['ALL', 'PENDING', 'RESOLVED', 'REJECTED', 'ESCALATED'] as StatusChip[]).map((s) => {
            const active = s === statusChip;
            return (
              <Pressable
                key={s}
                onPress={() => setStatusChip(s)}
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
      </View>

      {error ? <ThemedText style={{ color: palette.danger }}>{error}</ThemedText> : null}
      {success ? <ThemedText style={{ color: palette.success }}>{success}</ThemedText> : null}

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card, flex: 1 }]}
      >
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator />
          </View>
        ) : null}

        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
          {!loading && filtered.length === 0 ? <ThemedText style={{ opacity: 0.7 }}>Aucune réclamation</ThemedText> : null}

          {filtered.map((c) => {
            const id = String(c.id);
            const status = typeof c.status === 'string' ? c.status : '-';
            const busy = actionBusyId === id;
            const msg = typeof c.message === 'string' ? c.message : '';
            const preview = msg.length > 120 ? `${msg.slice(0, 120)}…` : msg;

            return (
              <View key={id} style={[styles.item, { borderColor: palette.border, backgroundColor: palette.card }]}>
                <View style={styles.topRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText type="defaultSemiBold">{preview || '—'}</ThemedText>
                    <ThemedText style={{ opacity: 0.75 }}>{c.createdAt ? String(c.createdAt) : '-'}</ThemedText>
                  </View>
                  <View style={[styles.badge, { borderColor: palette.border, backgroundColor: palette.inputBackground }]}>
                    <ThemedText style={{ opacity: 0.9 }}>{status}</ThemedText>
                  </View>
                </View>

                <Collapsible title="Actions rapides">
                  <View style={{ gap: 10 }}>
                    <Pressable
                      onPress={() => router.push({ pathname: '/(tabs)/admin-complaints/[complaintId]', params: { complaintId: id } } as any)}
                      style={[styles.actionPill, { borderColor: palette.border, backgroundColor: palette.card }]}
                    >
                      <ThemedText>Voir détail</ThemedText>
                    </Pressable>

                    <View style={styles.actionsRow}>
                      {(['RESOLVE', 'REJECT', 'ESCALATE'] as ComplaintProcessAction[]).map((a) => (
                        <Pressable
                          key={a}
                          onPress={() => process(id, a)}
                          disabled={busy}
                          style={[
                            styles.actionPill,
                            {
                              borderColor: a === 'REJECT' ? palette.danger : a === 'RESOLVE' ? palette.success : palette.tint,
                              backgroundColor:
                                a === 'REJECT'
                                  ? 'rgba(228,30,63,0.08)'
                                  : a === 'RESOLVE'
                                    ? 'rgba(66,183,42,0.10)'
                                    : 'rgba(24,119,242,0.10)',
                              opacity: busy ? 0.6 : 1,
                            },
                          ]}
                        >
                          <ThemedText
                            style={{
                              color: a === 'REJECT' ? palette.danger : a === 'RESOLVE' ? palette.success : palette.tint,
                            }}
                          >
                            {a}
                          </ThemedText>
                        </Pressable>
                      ))}
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
    gap: 10,
  },
  input: {
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
  viewBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
