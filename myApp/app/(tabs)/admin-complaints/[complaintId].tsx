import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import type { ApiError } from '@/lib/api';
import { AdminService, type AdminComplaint, type ComplaintProcessAction } from '@/lib/adminService';

export default function AdminComplaintDetailsScreen() {
  const { token } = useAuth();
  const { complaintId } = useLocalSearchParams<{ complaintId: string }>();

  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const id = typeof complaintId === 'string' ? complaintId : '';

  const [complaint, setComplaint] = useState<AdminComplaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const payload = await AdminService.getComplaints(token);
      const list = Array.isArray(payload) ? payload : [];
      const found = list.find((c) => String(c.id) === id) ?? null;
      setComplaint(found);
      if (!found) setError('Réclamation introuvable (pas d’endpoint détail côté backend).');
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

  const doProcess = useCallback(
    async (action: ComplaintProcessAction) => {
      if (!token || !id) return;
      Alert.alert('Traiter', `Action: ${action} ?`, [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          onPress: async () => {
            setError(null);
            setSuccess(null);
            setLoading(true);
            try {
              await AdminService.processComplaint(id, action, token);
              setSuccess(`Action envoyée: ${action}`);
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
    },
    [id, load, token]
  );

  const actionsDisabled = useMemo(() => loading || !token || !id, [id, loading, token]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Détail réclamation
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
            <ThemedText type="defaultSemiBold">Status</ThemedText>
            <ThemedText>{typeof complaint?.status === 'string' ? complaint.status : '-'}</ThemedText>
          </View>

          <ThemedText type="defaultSemiBold" style={{ marginTop: 6 }}>
            Message
          </ThemedText>
          <ThemedText style={{ opacity: 0.9 }}>{typeof complaint?.message === 'string' ? complaint.message : '-'}</ThemedText>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Date</ThemedText>
            <ThemedText>{complaint?.createdAt ? String(complaint.createdAt) : '-'}</ThemedText>
          </View>

          <ThemedText type="defaultSemiBold" style={{ marginTop: 10 }}>
            Traiter
          </ThemedText>

          <View style={styles.actionsRow}>
            {(['RESOLVE', 'REJECT', 'ESCALATE'] as ComplaintProcessAction[]).map((a) => (
              <Pressable
                key={a}
                onPress={() => doProcess(a)}
                disabled={actionsDisabled}
                style={[styles.actionBtn, { borderColor: palette.tint, opacity: actionsDisabled ? 0.6 : 1 }]}
              >
                <ThemedText style={{ color: palette.tint }}>{a}</ThemedText>
              </Pressable>
            ))}
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
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
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
