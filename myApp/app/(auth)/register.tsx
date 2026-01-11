import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth, type Role } from '@/lib/auth';

function roleLabel(role: Role) {
  if (role === 'USER') return 'Utilisateur';
  if (role === 'DRIVER') return 'Chauffeur';
  return 'Admin';
}

function RoleSelect({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  const [open, setOpen] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.select, { borderColor: palette.icon, backgroundColor: palette.background }]}
      >
        <ThemedText type="defaultSemiBold">{roleLabel(value)}</ThemedText>
        <ThemedText style={{ opacity: 0.7 }}>Changer</ThemedText>
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.background, borderColor: palette.icon }]}
          >
            <ThemedText type="subtitle" style={{ fontFamily: Fonts.rounded }}>
              Rôle du compte
            </ThemedText>

            {(['USER', 'DRIVER', 'ADMIN'] as Role[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => {
                  onChange(r);
                  setOpen(false);
                }}
                style={[styles.modalItem, { borderColor: palette.icon }]}
              >
                <ThemedText type={r === value ? 'defaultSemiBold' : 'default'}>{roleLabel(r)}</ThemedText>
              </Pressable>
            ))}

            <Pressable onPress={() => setOpen(false)} style={styles.modalClose}>
              <ThemedText type="link">Annuler</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function RegisterScreen() {
  const { register, selectedRole, setSelectedRole } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (name.trim().length === 0) return false;
    if (email.trim().length === 0) return false;
    if (password.length === 0) return false;

    if (selectedRole === 'USER') {
      return phone.trim().length > 0;
    }

    if (selectedRole === 'DRIVER') {
      return phone.trim().length > 0 && licenseNumber.trim().length > 0 && vehicleInfo.trim().length > 0;
    }

    return true;
  }, [email, licenseNumber, name, password, phone, selectedRole, submitting, vehicleInfo]);

  const onSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await register({
        role: selectedRole,
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        vehicleInfo: vehicleInfo.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(typeof e?.message === 'string' ? e.message : 'Inscription impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Inscription
        </ThemedText>
        <ThemedText style={{ opacity: 0.8 }}>Crée ton compte en quelques secondes</ThemedText>
      </View>

      <View style={[styles.card, { borderColor: palette.icon, backgroundColor: palette.background }]}>
        <ThemedText type="defaultSemiBold">Rôle</ThemedText>
        <RoleSelect value={selectedRole} onChange={setSelectedRole} />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Nom
        </ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nom complet"
          placeholderTextColor={palette.icon}
          style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
        />

        {(selectedRole === 'USER' || selectedRole === 'DRIVER') ? (
          <>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              Téléphone
            </ThemedText>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="ex: +212..."
              placeholderTextColor={palette.icon}
              keyboardType="phone-pad"
              style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
            />
          </>
        ) : null}

        {selectedRole === 'DRIVER' ? (
          <>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              Numéro de permis
            </ThemedText>
            <TextInput
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="ex: AB12345"
              placeholderTextColor={palette.icon}
              style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
            />

            <ThemedText type="defaultSemiBold" style={styles.label}>
              Véhicule
            </ThemedText>
            <TextInput
              value={vehicleInfo}
              onChangeText={setVehicleInfo}
              placeholder="ex: Mercedes Classe E, Noir"
              placeholderTextColor={palette.icon}
              style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
            />
          </>
        ) : null}

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Email
        </ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="ex: nom@mail.com"
          placeholderTextColor={palette.icon}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
        />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Mot de passe
        </ThemedText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={palette.icon}
          secureTextEntry
          style={[styles.input, { borderColor: palette.icon, color: palette.text }]}
        />

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
          {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={{ color: '#fff' }}>Créer le compte</ThemedText>}
        </Pressable>

        <View style={styles.footerRow}>
          <ThemedText style={{ opacity: 0.8 }}>Déjà inscrit ?</ThemedText>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <ThemedText type="link">Se connecter</ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 18,
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
  footerRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  select: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  modalItem: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  modalClose: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
});
