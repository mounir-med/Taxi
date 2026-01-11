import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import type { ApiError } from '@/lib/api';
import { AdminService, type AdminComplaint } from '@/lib/adminService';

export default function AdminComplaintsListScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [items, setItems] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
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
    const f = statusFilter.trim().toUpperCase();
    if (!f) return items;
    return items.filter((c) => (typeof c.status === 'string' ? c.status.toUpperCase() : '').includes(f));
  }, [items, statusFilter]);

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
          <Pressable onPress={load} style={[styles.actionBtn, { borderColor: palette.icon }]} disabled={loading}>
            <ThemedText>{loading ? '...' : 'Rafraîchir'}</ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={[styles.card, { borderColor: palette.icon, backgroundColor: palette.background }]}
      >
        <ThemedText type="defaultSemiBold">Filtre status</ThemedText>
        <TextInput
          value={statusFilter}
          onChangeText={setStatusFilter}
          placeholder="PENDING / RESOLVED ..."
          placeholderTextColor={palette.icon}
          autoCapitalize="characters"
          style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
        />
      </View>

      {error ? <ThemedText style={{ color: '#c0392b' }}>{error}</ThemedText> : null}

      <View style={[styles.card, { borderColor: palette.icon, backgroundColor: palette.background, flex: 1 }]}
      >
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator />
          </View>
        ) : null}

        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
          {!loading && filtered.length === 0 ? <ThemedText style={{ opacity: 0.7 }}>Aucune réclamation</ThemedText> : null}

          {filtered.map((c) => (
            <View key={String(c.id)} style={[styles.item, { borderColor: palette.icon }]}>
              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">ID</ThemedText>
                <ThemedText>{String(c.id)}</ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Status</ThemedText>
                <ThemedText>{typeof c.status === 'string' ? c.status : '-'}</ThemedText>
              </View>

              <ThemedText style={{ opacity: 0.9 }}>{typeof c.message === 'string' ? c.message : '-'}</ThemedText>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Date</ThemedText>
                <ThemedText>{c.createdAt ? String(c.createdAt) : '-'}</ThemedText>
              </View>

              <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/admin-complaints/[complaintId]', params: { complaintId: String(c.id) } } as any)}
                style={[styles.viewBtn, { borderColor: palette.icon }]}
              >
                <ThemedText>Voir détail</ThemedText>
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
});
