import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

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

function formatDateTime(d: Date | null): string {
  if (!d) return '-';
  try {
    return d.toLocaleString();
  } catch {
    return d.toISOString();
  }
}

export default function CreateTripScreen() {
  const { token, profile, refreshProfile } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLatitude, setPickupLatitude] = useState('');
  const [pickupLongitude, setPickupLongitude] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationLatitude, setDestinationLatitude] = useState('');
  const [destinationLongitude, setDestinationLongitude] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [availableSeats, setAvailableSeats] = useState('4');
  const [vehicleType, setVehicleType] = useState('');
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [expiresDate, setExpiresDate] = useState<Date | null>(null);
  const [pickerField, setPickerField] = useState<'departure' | 'expires' | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pickerOpen, setPickerOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof (profile as any)?.vehicleInfo === 'string' && (profile as any).vehicleInfo.trim().length > 0) {
      setVehicleType(String((profile as any).vehicleInfo));
    }
  }, [profile]);

  useEffect(() => {
    if (!token) return;
    if (!profile) {
      void refreshProfile();
      return;
    }
    if (typeof (profile as any)?.vehicleInfo !== 'string' || (profile as any).vehicleInfo.trim().length === 0) {
      void refreshProfile();
    }
  }, [profile, refreshProfile, token]);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (!token) return false;

    if (pickupAddress.trim().length === 0) return false;
    if (destinationAddress.trim().length === 0) return false;
    if (vehicleType.trim().length === 0) return false;

    const pLat = parseNumber(pickupLatitude);
    const pLng = parseNumber(pickupLongitude);
    const dLat = parseNumber(destinationLatitude);
    const dLng = parseNumber(destinationLongitude);

    if (pLat === null || pLng === null || dLat === null || dLng === null) return false;
    if (pLat === 0 || pLng === 0 || dLat === 0 || dLng === 0) return false;

    const price = parseNumber(proposedPrice);
    if (price === null || price <= 0) return false;

    const duration = parseNumber(estimatedDuration);
    if (duration === null || duration <= 0) return false;

    const seats = parseNumber(availableSeats);
    if (seats === null || seats <= 0) return false;

    if (!departureDate || Number.isNaN(departureDate.getTime())) return false;
    if (!expiresDate || Number.isNaN(expiresDate.getTime())) return false;

    return true;
  }, [
    availableSeats,
    departureDate,
    destinationAddress,
    destinationLatitude,
    destinationLongitude,
    estimatedDuration,
    expiresDate,
    pickupAddress,
    pickupLatitude,
    pickupLongitude,
    proposedPrice,
    submitting,
    token,
    vehicleType,
  ]);

  const onSubmit = async () => {
    if (!canSubmit || !token) return;

    setError(null);
    setSubmitting(true);
    try {
      const pLat = parseNumber(pickupLatitude);
      const pLng = parseNumber(pickupLongitude);
      const dLat = parseNumber(destinationLatitude);
      const dLng = parseNumber(destinationLongitude);
      const price = parseNumber(proposedPrice);
      const duration = parseNumber(estimatedDuration);
      const seats = parseNumber(availableSeats);

      if (pLat === null || pLng === null || dLat === null || dLng === null || price === null || duration === null || seats === null) {
        setError('Champs invalides');
        return;
      }

      if (!departureDate || !expiresDate) {
        setError('Dates invalides');
        return;
      }

      const depIso = departureDate.toISOString();
      const expIso = expiresDate.toISOString();

      await apiRequest('/api/driver/trips', {
        method: 'POST',
        token,
        body: {
          pickupAddress: pickupAddress.trim(),
          pickupLatitude: pLat,
          pickupLongitude: pLng,
          destinationAddress: destinationAddress.trim(),
          destinationLatitude: dLat,
          destinationLongitude: dLng,
          proposedPrice: price,
          departureTime: depIso,
          estimatedDuration: duration,
          availableSeats: seats,
          vehicleType: vehicleType.trim(),
          expiresAt: expIso,
        },
      });

      Alert.alert('Succès', 'Trajet publié');
      router.replace('/(tabs)/trips' as any);
    } catch (e: any) {
      const apiErr = e as ApiError;
      setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Création impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
            Créer un trajet
          </ThemedText>
          <ThemedText style={{ opacity: 0.8 }}>Publie une proposition de trajet</ThemedText>
        </View>

        <View style={[styles.card, { borderColor: palette.icon, backgroundColor: palette.background }]}>
          <ThemedText type="defaultSemiBold" style={styles.label}>
            Adresse de départ
          </ThemedText>
          <TextInput
            value={pickupAddress}
            onChangeText={setPickupAddress}
            placeholder="ex: Centre-ville"
            placeholderTextColor={palette.icon}
            style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                Latitude
              </ThemedText>
              <TextInput
                value={pickupLatitude}
                onChangeText={setPickupLatitude}
                placeholder="ex: 33.58"
                placeholderTextColor={palette.icon}
                keyboardType="numeric"
                style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
              />
            </View>
            <View style={styles.col}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                Longitude
              </ThemedText>
              <TextInput
                value={pickupLongitude}
                onChangeText={setPickupLongitude}
                placeholder="ex: -7.61"
                placeholderTextColor={palette.icon}
                keyboardType="numeric"
                style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
              />
            </View>
          </View>

          <ThemedText type="defaultSemiBold" style={styles.label}>
            {'Adresse d\'arrivée'}
          </ThemedText>
          <TextInput
            value={destinationAddress}
            onChangeText={setDestinationAddress}
            placeholder="ex: Gare"
            placeholderTextColor={palette.icon}
            style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                Latitude
              </ThemedText>
              <TextInput
                value={destinationLatitude}
                onChangeText={setDestinationLatitude}
                placeholder="ex: 33.60"
                placeholderTextColor={palette.icon}
                keyboardType="numeric"
                style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
              />
            </View>
            <View style={styles.col}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                Longitude
              </ThemedText>
              <TextInput
                value={destinationLongitude}
                onChangeText={setDestinationLongitude}
                placeholder="ex: -7.55"
                placeholderTextColor={palette.icon}
                keyboardType="numeric"
                style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                Prix proposé
              </ThemedText>
              <TextInput
                value={proposedPrice}
                onChangeText={setProposedPrice}
                placeholder="ex: 50"
                placeholderTextColor={palette.icon}
                keyboardType="numeric"
                style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
              />
            </View>
            <View style={styles.col}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                Places
              </ThemedText>
              <TextInput
                value={availableSeats}
                onChangeText={setAvailableSeats}
                placeholder="4"
                placeholderTextColor={palette.icon}
                keyboardType="numeric"
                style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                Durée (minutes)
              </ThemedText>
              <TextInput
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
                placeholder="ex: 30"
                placeholderTextColor={palette.icon}
                keyboardType="numeric"
                style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
              />
            </View>
            <View style={styles.col}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                Type véhicule
              </ThemedText>
              <TextInput
                value={vehicleType}
                editable={false}
                placeholder="ex: Sedan"
                placeholderTextColor={palette.icon}
                style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
              />
            </View>
          </View>

          <ThemedText type="defaultSemiBold" style={styles.label}>
            Heure départ
          </ThemedText>
          <Pressable
            onPress={() => {
              setPickerField('departure');
              setPickerMode('date');
              setPickerOpen(true);
            }}
            style={[styles.input, { borderColor: palette.icon, justifyContent: 'center' }]}
          >
            <ThemedText style={{ color: departureDate ? palette.text : palette.icon }}>
              {departureDate ? formatDateTime(departureDate) : 'Choisir date/heure'}
            </ThemedText>
          </Pressable>

          <ThemedText type="defaultSemiBold" style={styles.label}>
            Expire le
          </ThemedText>
          <Pressable
            onPress={() => {
              setPickerField('expires');
              setPickerMode('date');
              setPickerOpen(true);
            }}
            style={[styles.input, { borderColor: palette.icon, justifyContent: 'center' }]}
          >
            <ThemedText style={{ color: expiresDate ? palette.text : palette.icon }}>
              {expiresDate ? formatDateTime(expiresDate) : 'Choisir date/heure'}
            </ThemedText>
          </Pressable>

          {pickerOpen && pickerField ? (
            <DateTimePicker
              value={(pickerField === 'departure' ? departureDate : expiresDate) ?? new Date()}
              mode={pickerMode}
              display={Platform.OS === 'android' ? 'default' : 'spinner'}
              onChange={(event: unknown, selected?: Date) => {
                if (Platform.OS === 'android') {
                  if (!selected) {
                    setPickerOpen(false);
                    setPickerField(null);
                    return;
                  }

                  if (pickerMode === 'date') {
                    const base = selected;
                    if (pickerField === 'departure') {
                      const prev = departureDate ?? new Date();
                      setDepartureDate(new Date(base.getFullYear(), base.getMonth(), base.getDate(), prev.getHours(), prev.getMinutes()));
                    } else {
                      const prev = expiresDate ?? new Date();
                      setExpiresDate(new Date(base.getFullYear(), base.getMonth(), base.getDate(), prev.getHours(), prev.getMinutes()));
                    }
                    setPickerMode('time');
                    return;
                  }

                  if (pickerMode === 'time') {
                    const base = selected;
                    if (pickerField === 'departure') {
                      const prev = departureDate ?? new Date();
                      setDepartureDate(new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), base.getHours(), base.getMinutes()));
                    } else {
                      const prev = expiresDate ?? new Date();
                      setExpiresDate(new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), base.getHours(), base.getMinutes()));
                    }
                    setPickerOpen(false);
                    setPickerField(null);
                    setPickerMode('date');
                  }

                  return;
                }

                if (!selected) return;

                if (pickerField === 'departure') {
                  setDepartureDate(selected);
                } else {
                  setExpiresDate(selected);
                }

                if ((event as any)?.type === 'dismissed') {
                  setPickerOpen(false);
                  setPickerField(null);
                  setPickerMode('date');
                }
              }}
            />
          ) : null}

          {error ? <ThemedText style={{ color: '#c0392b', marginTop: 8 }}>{error}</ThemedText> : null}

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
            {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={{ color: '#fff' }}>Publier</ThemedText>}
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    paddingBottom: 24,
    gap: 14,
  },
  header: {
    marginTop: 6,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  label: {
    marginTop: 8,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
});
