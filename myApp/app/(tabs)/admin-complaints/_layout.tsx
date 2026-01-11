import { Stack } from 'expo-router';
import React from 'react';

export default function AdminComplaintsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Réclamations' }} />
      <Stack.Screen name="[complaintId]" options={{ title: 'Détail réclamation' }} />
      <Stack.Screen name="stats" options={{ title: 'Stats réclamations' }} />
    </Stack>
  );
}
