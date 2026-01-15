import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth, type Role } from '@/lib/auth';
import type { ApiError } from '@/lib/api';

const Logo = require('@/assets/images/logo.png');

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
        style={[styles.select, { borderColor: palette.border, backgroundColor: palette.inputBackground }]}
      >
        <ThemedText type="defaultSemiBold">{roleLabel(value)}</ThemedText>
        <ThemedText style={{ opacity: 0.7 }}>Changer</ThemedText>
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.card, borderColor: palette.border }]}
          >
            <ThemedText type="subtitle" style={{ fontFamily: Fonts.rounded }}>
              Sélectionner un rôle
            </ThemedText>

            {(['USER', 'DRIVER', 'ADMIN'] as Role[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => {
                  onChange(r);
                  setOpen(false);
                }}
                style={[styles.modalItem, { borderColor: palette.border, backgroundColor: palette.inputBackground }]}
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

export default function LoginScreen() {
  const { login, selectedRole, setSelectedRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const canSubmit = useMemo(() => email.trim().length > 0 && password.length > 0 && !submitting, [email, password, submitting]);

  const onSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await login({ role: selectedRole, email: email.trim(), password });
      if (selectedRole === 'DRIVER') {
        router.replace('/(tabs)/driver-dashboard' as any);
      } else if (selectedRole === 'ADMIN') {
        router.replace('/(tabs)/admin-dashboard' as any);
      } else {
        router.replace('/(tabs)/available-trips' as any);
      }
    } catch (e: any) {
      const apiErr = e as ApiError;
      if (selectedRole === 'DRIVER' && apiErr && typeof apiErr.status === 'number') {
        if (apiErr.status === 401) {
          setError('Identifiants invalides');
        } else if (apiErr.status === 403) {
          setError('Compte banni');
        } else {
          setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Connexion impossible');
        }
      } else {
        setError(typeof apiErr?.message === 'string' ? apiErr.message : 'Connexion impossible');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={Logo} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.header}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Connexion
        </ThemedText>
        <ThemedText style={{ opacity: 0.8 }}>Accède à ton espace en toute sécurité</ThemedText>
      </View>

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}>
        <ThemedText type="defaultSemiBold">Rôle</ThemedText>
        <RoleSelect value={selectedRole} onChange={setSelectedRole} />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Email
        </ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="ex: nom@mail.com"
          placeholderTextColor={palette.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]}
        />

        <ThemedText type="defaultSemiBold" style={styles.label}>
          Mot de passe
        </ThemedText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={palette.muted}
          secureTextEntry
          style={[styles.input, { borderColor: palette.border, backgroundColor: palette.inputBackground, color: palette.text }]}
        />

        {error ? <ThemedText style={{ color: palette.danger, marginTop: 8 }}>{error}</ThemedText> : null}

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
          {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={{ color: '#fff' }}>Se connecter</ThemedText>}
        </Pressable>

        <View style={styles.footerRow}>
          <ThemedText style={{ opacity: 0.8 }}>Pas de compte ?</ThemedText>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <ThemedText type="link">Créer un compte</ThemedText>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
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
