import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';

export default function AccountScreen() {
  const { loading, profile, role, logout, refreshProfile } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
        Compte
      </ThemedText>

      <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}>
        {error ? <ThemedText style={{ color: palette.danger }}>{error}</ThemedText> : null}

        <View style={styles.row}>
          <ThemedText type="defaultSemiBold">Rôle</ThemedText>
          <ThemedText>{role ?? '-'}</ThemedText>
        </View>

        <View style={styles.row}>
          <ThemedText type="defaultSemiBold">Email</ThemedText>
          <ThemedText>{typeof profile?.email === 'string' ? profile.email : '-'}</ThemedText>
        </View>

        <View style={styles.row}>
          <ThemedText type="defaultSemiBold">Nom</ThemedText>
          <ThemedText>{typeof profile?.name === 'string' ? profile.name : '-'}</ThemedText>
        </View>

        <View style={styles.row}>
          <ThemedText type="defaultSemiBold">Téléphone</ThemedText>
          <ThemedText>{typeof profile?.phone === 'string' ? profile.phone : '-'}</ThemedText>
        </View>

        {role === 'DRIVER' ? (
          <>
            <View style={styles.row}>
              <ThemedText type="defaultSemiBold">Statut</ThemedText>
              <ThemedText>{typeof (profile as any)?.status === 'string' ? String((profile as any).status) : '-'}</ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText type="defaultSemiBold">Permis</ThemedText>
              <ThemedText>{typeof (profile as any)?.licenseNumber === 'string' ? String((profile as any).licenseNumber) : '-'}</ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText type="defaultSemiBold">Véhicule</ThemedText>
              <ThemedText>{typeof (profile as any)?.vehicleInfo === 'string' ? String((profile as any).vehicleInfo) : '-'}</ThemedText>
            </View>
          </>
        ) : null}

        <Pressable
          onPress={async () => {
            setError(null);
            setRefreshing(true);
            try {
              await refreshProfile();
            } catch (e: any) {
              setError(typeof e?.message === 'string' ? e.message : 'Rafraîchissement impossible');
            } finally {
              setRefreshing(false);
            }
          }}
          style={[styles.refreshBtn, { borderColor: palette.border }]}
        >
          {refreshing ? <ActivityIndicator /> : <ThemedText>Rafraîchir profil</ThemedText>}
        </Pressable>

        <Pressable
          onPress={logout}
          style={[styles.logoutBtn, { borderColor: palette.danger }]}
        >
          <ThemedText style={{ color: palette.danger }}>Se déconnecter</ThemedText>
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
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  logoutBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  refreshBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
