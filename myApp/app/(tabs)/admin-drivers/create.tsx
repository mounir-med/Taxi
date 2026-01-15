import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';
import type { ApiError } from '@/lib/api';
import { AdminService, type DriverStatus } from '@/lib/adminService';

export default function AdminCreateDriverScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [status, setStatus] = useState<DriverStatus>('ACTIVE');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    return (
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length > 0 &&
      phone.trim().length > 0 &&
      licenseNumber.trim().length > 0 &&
      vehicleInfo.trim().length > 0
    );
  }, [email, licenseNumber, name, password, phone, submitting, vehicleInfo]);

  const onSubmit = async () => {
    if (!token) return;
    if (!canSubmit) return;

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const payload = await AdminService.createDriver(
        {
          email: email.trim(),
          password,
          name: name.trim(),
          phone: phone.trim(),
          licenseNumber: licenseNumber.trim(),
          vehicleInfo: vehicleInfo.trim(),
          status,
        },
        token
      );

      const createdId: string | null = payload && typeof payload === 'object' && typeof (payload as any).id === 'string' ? (payload as any).id : null;

      setSuccess('Driver créé');
      if (createdId) {
        router.replace({ pathname: '/(tabs)/admin-drivers/[driverId]', params: { driverId: createdId } } as any);
        return;
      }
      router.back();
    } catch (e: any) {
      const apiErr = e as ApiError;
      if (apiErr?.status === 409) {
        setError('Driver existe déjà');
      } else {
        setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Création impossible');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
        Créer driver
      </ThemedText>

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}
      >
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Nom
        </ThemedText>
        <TextInput value={name} onChangeText={setName} placeholder="Nom" placeholderTextColor={palette.muted} style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]} />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Email
        </ThemedText>
        <TextInput value={email} onChangeText={setEmail} placeholder="email" placeholderTextColor={palette.muted} autoCapitalize="none" keyboardType="email-address" style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]} />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Password
        </ThemedText>
        <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={palette.muted} secureTextEntry style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]} />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Téléphone
        </ThemedText>
        <TextInput value={phone} onChangeText={setPhone} placeholder="+212..." placeholderTextColor={palette.muted} keyboardType="phone-pad" style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]} />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Permis
        </ThemedText>
        <TextInput value={licenseNumber} onChangeText={setLicenseNumber} placeholder="AB12345" placeholderTextColor={palette.muted} style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]} />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Véhicule
        </ThemedText>
        <TextInput value={vehicleInfo} onChangeText={setVehicleInfo} placeholder="Véhicule" placeholderTextColor={palette.muted} style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]} />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Status (ACTIVE/PAUSED/BANNED)
        </ThemedText>
        <TextInput
          value={status}
          onChangeText={(t) => setStatus((t.trim().toUpperCase() as DriverStatus) || 'ACTIVE')}
          placeholder="ACTIVE"
          placeholderTextColor={palette.muted}
          autoCapitalize="characters"
          style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]}
        />

        {error ? <ThemedText style={{ color: palette.danger }}>{error}</ThemedText> : null}
        {success ? <ThemedText style={{ color: palette.success }}>{success}</ThemedText> : null}

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={[styles.primaryBtn, { backgroundColor: canSubmit ? palette.tint : palette.border, opacity: canSubmit ? 1 : 0.6 }]}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={{ color: '#fff' }}>Créer</ThemedText>}
        </Pressable>
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
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  label: {
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryBtn: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
