import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import { apiRequest, type ApiError } from '@/lib/api';
import { UserService, type Trip } from '@/lib/userService';

type Complaint = {
  id?: string;
  message?: string;
  status?: string;
  createdAt?: unknown;
  user?: any;
  driver?: any;
  trip?: any;
};

export default function DriverComplaintsScreen() {
  const { token, role } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [tripId, setTripId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [message, setMessage] = useState('');

  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [myTripsLoading, setMyTripsLoading] = useState(false);
  const [showMyTrips, setShowMyTrips] = useState(false);

  const isUser = useMemo(() => role === 'USER', [role]);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const payload = isUser
        ? await UserService.getMyComplaints(token)
        : await apiRequest<Complaint[]>('/api/driver/complaints', { token });
      setItems(Array.isArray(payload) ? payload : []);
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [isUser, token]);

  const submit = useCallback(async () => {
    if (!token) return;
    if (!isUser) return;

    const tId = tripId.trim();
    const dId = driverId.trim();
    const msg = message.trim();

    if (!tId || !dId || !msg) {
      setError('Veuillez remplir tripId, driverId et message');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await UserService.createComplaint(dId, tId, msg, token);
      setSuccess('Réclamation créée (PENDING)');
      setMessage('');
      await load();
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Création impossible');
    } finally {
      setLoading(false);
    }
  }, [driverId, isUser, load, message, token, tripId]);

  const loadMyTrips = useCallback(async () => {
    if (!token) return;
    if (!isUser) return;
    setMyTripsLoading(true);
    try {
      const payload = await UserService.getMyTrips(token);
      setMyTrips(Array.isArray(payload) ? payload : []);
    } catch {
      setMyTrips([]);
    } finally {
      setMyTripsLoading(false);
    }
  }, [isUser, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
        Réclamations
      </ThemedText>

      <View style={[styles.card, { borderColor: palette.icon, backgroundColor: palette.background }]}>
        {isUser ? (
          <View style={styles.form}>
            <ThemedText type="defaultSemiBold">Créer une réclamation</ThemedText>

            <Pressable
              onPress={async () => {
                const next = !showMyTrips;
                setShowMyTrips(next);
                if (next && myTrips.length === 0) {
                  await loadMyTrips();
                }
              }}
              style={[styles.pickBtn, { borderColor: palette.icon }]}
            >
              <ThemedText>Choisir depuis Mes trajets</ThemedText>
            </Pressable>

            {showMyTrips ? (
              <View style={[styles.pickList, { borderColor: palette.icon }]}>
                {myTripsLoading ? (
                  <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                    <ActivityIndicator />
                  </View>
                ) : null}

                {!myTripsLoading && myTrips.length === 0 ? (
                  <ThemedText style={{ opacity: 0.7 }}>Aucun trajet accepté</ThemedText>
                ) : null}

                <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 6 }}>
                  {myTrips.map((t) => (
                    <Pressable
                      key={String(t.id)}
                      onPress={() => {
                        setTripId(String(t.id));
                        const dId = t.driver && typeof t.driver.id === 'string' ? t.driver.id : '';
                        setDriverId(dId);
                        if (!dId) {
                          setError('DriverId introuvable sur ce trajet (driver manquant).');
                        }
                        setShowMyTrips(false);
                      }}
                      style={[styles.pickItem, { borderColor: palette.icon }]}
                    >
                      <View style={styles.row}>
                        <ThemedText type="defaultSemiBold">Trip</ThemedText>
                        <ThemedText>{String(t.id)}</ThemedText>
                      </View>
                      <View style={styles.row}>
                        <ThemedText type="defaultSemiBold">Driver</ThemedText>
                        <ThemedText>{t.driver && typeof t.driver.name === 'string' ? t.driver.name : '-'}</ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <ThemedText style={styles.label}>Trip ID</ThemedText>
            <TextInput
              value={tripId}
              onChangeText={setTripId}
              placeholder="tripId"
              placeholderTextColor={palette.icon}
              autoCapitalize="none"
              style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
            />

            <ThemedText style={styles.label}>Driver ID</ThemedText>
            <TextInput
              value={driverId}
              onChangeText={setDriverId}
              placeholder="driverId"
              placeholderTextColor={palette.icon}
              autoCapitalize="none"
              style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
            />

            <ThemedText style={styles.label}>Message</ThemedText>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Votre message"
              placeholderTextColor={palette.icon}
              multiline
              style={[styles.textarea, { borderColor: palette.icon, color: palette.text }]}
            />

            <Pressable
              onPress={submit}
              disabled={loading}
              style={[styles.primaryBtn, { backgroundColor: palette.tint, opacity: loading ? 0.7 : 1 }]}
            >
              <ThemedText style={{ color: '#fff' }}>{loading ? '...' : 'Envoyer'}</ThemedText>
            </Pressable>
          </View>
        ) : null}

        <Pressable onPress={load} style={[styles.refreshBtn, { borderColor: palette.icon }]}>
          <ThemedText>Rafraîchir</ThemedText>
        </Pressable>

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator />
          </View>
        ) : null}

        {error ? <ThemedText style={{ color: '#c0392b' }}>{error}</ThemedText> : null}
        {success ? <ThemedText style={{ color: '#1e8449' }}>{success}</ThemedText> : null}

        <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
          {items.length === 0 && !loading ? <ThemedText style={{ opacity: 0.7 }}>Aucune réclamation</ThemedText> : null}

          {items.map((c) => (
            <View key={String(c.id ?? Math.random())} style={[styles.item, { borderColor: palette.icon }]}
            >
              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Statut</ThemedText>
                <ThemedText>{typeof c.status === 'string' ? c.status : '-'}</ThemedText>
              </View>
              <ThemedText style={{ opacity: 0.9 }}>{typeof c.message === 'string' ? c.message : '-'}</ThemedText>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Date</ThemedText>
                <ThemedText>{c.createdAt ? String(c.createdAt) : '-'}</ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">User</ThemedText>
                <ThemedText>{c.user && typeof c.user.email === 'string' ? c.user.email : '-'}</ThemedText>
              </View>

              {isUser ? (
                <View style={styles.row}>
                  <ThemedText type="defaultSemiBold">Driver</ThemedText>
                  <ThemedText>
                    {c.driver && typeof c.driver.name === 'string'
                      ? c.driver.name
                      : c.driver && typeof c.driver.email === 'string'
                        ? c.driver.email
                        : '-'}
                  </ThemedText>
                </View>
              ) : null}

              <View style={styles.row}>
                <ThemedText type="defaultSemiBold">Trip</ThemedText>
                <ThemedText>{c.trip && typeof c.trip.id === 'string' ? c.trip.id : '-'}</ThemedText>
              </View>
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
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    flex: 1,
  },
  form: {
    gap: 10,
  },
  pickBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  pickList: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    maxHeight: 220,
  },
  pickItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
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
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
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
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
});
