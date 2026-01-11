import { Stack } from 'expo-router';
import React from 'react';

export default function TripsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Mes trajets' }} />
      <Stack.Screen name="[tripId]" options={{ title: 'Détail trajet' }} />
      <Stack.Screen name="receipt" options={{ title: 'Reçu' }} />
    </Stack>
  );
}
