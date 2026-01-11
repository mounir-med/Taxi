import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import { apiRequest, type ApiError } from '@/lib/api';

function parseNumber(input: string): number | null {
  const n = Number(input);
  return Number.isFinite(n) ? n : null;
}

export default function UpdateLocationScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!token) return false;
    if (submitting) return false;

    const lat = parseNumber(latitude);
    const lng = parseNumber(longitude);

    if (lat === null || lng === null) return false;
    if (lat === 0 || lng === 0) return false;

    return true;
  }, [latitude, longitude, submitting, token]);

  const onSubmit = async () => {
    if (!token || !canSubmit) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const lat = parseNumber(latitude);
      const lng = parseNumber(longitude);
      if (lat === null || lng === null) {
        setError('Coordonnées invalides');
        return;
      }

      const payload = await apiRequest<any>('/api/driver/location', {
        method: 'POST',
        token,
        body: {
          latitude: lat,
          longitude: lng,
        },
      });

      setSuccess(typeof payload?.message === 'string' ? payload.message : 'Localisation mise à jour');
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Mise à jour impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
        Localisation
      </ThemedText>

      <View style={[styles.card, { borderColor: palette.icon, backgroundColor: palette.background }]}>
        <ThemedText type="defaultSemiBold">Latitude</ThemedText>
        <TextInput
          value={latitude}
          onChangeText={setLatitude}
          placeholder="ex: 33.58"
          placeholderTextColor={palette.icon}
          keyboardType="numeric"
          style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
        />

        <ThemedText type="defaultSemiBold">Longitude</ThemedText>
        <TextInput
          value={longitude}
          onChangeText={setLongitude}
          placeholder="ex: -7.61"
          placeholderTextColor={palette.icon}
          keyboardType="numeric"
          style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
        />

        {error ? <ThemedText style={{ color: '#c0392b' }}>{error}</ThemedText> : null}
        {success ? <ThemedText style={{ color: '#27ae60' }}>{success}</ThemedText> : null}

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={[
            styles.primaryBtn,
            {
              backgroundColor: canSubmit ? palette.tint : palette.icon,
              opacity: canSubmit ? 1 : 0.6,
            },
          ]}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={{ color: '#fff' }}>Envoyer</ThemedText>}
        </Pressable>
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
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  primaryBtn: {
    marginTop: 6,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
