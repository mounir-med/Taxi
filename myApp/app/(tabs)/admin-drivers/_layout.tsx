import { Stack } from 'expo-router';
import React from 'react';

export default function AdminDriversLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Drivers' }} />
      <Stack.Screen name="create" options={{ title: 'Créer driver' }} />
      <Stack.Screen name="[driverId]" options={{ title: 'Détail driver' }} />
    </Stack>
  );
}
