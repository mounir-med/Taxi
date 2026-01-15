import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TripReceiptScreen() {
  const params = useLocalSearchParams<Record<string, string>>();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const finalPrice = params.finalPrice ? Number(params.finalPrice) : undefined;
  const tvaAmount = params.tvaAmount ? Number(params.tvaAmount) : undefined;
  const driverNetAmount = params.driverNetAmount ? Number(params.driverNetAmount) : undefined;
  const tripId = typeof params.id === 'string' ? params.id : undefined;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Reçu
        </ThemedText>

        <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Trip ID</ThemedText>
            <ThemedText>{tripId ?? '-'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Prix final</ThemedText>
            <ThemedText>{typeof finalPrice === 'number' && Number.isFinite(finalPrice) ? finalPrice.toFixed(2) : '-'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">TVA</ThemedText>
            <ThemedText>{typeof tvaAmount === 'number' && Number.isFinite(tvaAmount) ? tvaAmount.toFixed(2) : '-'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText type="defaultSemiBold">Net chauffeur</ThemedText>
            <ThemedText>{typeof driverNetAmount === 'number' && Number.isFinite(driverNetAmount) ? driverNetAmount.toFixed(2) : '-'}</ThemedText>
          </View>

          <Pressable onPress={() => router.replace('/(tabs)/trips' as any)} style={[styles.btn, { borderColor: palette.border, backgroundColor: palette.card }]}>
            <ThemedText>Retour à mes trajets</ThemedText>
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
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
});
