import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, token, role } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (token && inAuthGroup) {
      if (role === 'DRIVER') {
        router.replace('/(tabs)/driver-dashboard' as any);
        return;
      }

      if (role === 'ADMIN') {
        router.replace('/(tabs)/admin-dashboard' as any);
        return;
      }

      router.replace('/(tabs)/available-trips' as any);
      return;
    }

    const inTabsGroup = segments[0] === '(tabs)';
    if (token && inTabsGroup) {
      const current = segments[1] ?? '';
      const driverOnly = new Set(['driver-dashboard', 'create-trip', 'trips', 'wallet', 'location']);
      const userOnly = new Set(['available-trips', 'my-trips', 'drivers']);
      const adminOnly = new Set(['admin-dashboard', 'admin-drivers', 'admin-trips', 'admin-complaints', 'admin-wallet']);

      if (role === 'DRIVER') {
        if (userOnly.has(current) || adminOnly.has(current)) {
          router.replace('/(tabs)/driver-dashboard' as any);
          return;
        }
      } else if (role === 'ADMIN') {
        if (current === 'complaints') {
          router.replace('/(tabs)/admin-dashboard' as any);
          return;
        }
        if (driverOnly.has(current) || userOnly.has(current)) {
          router.replace('/(tabs)/admin-dashboard' as any);
          return;
        }
      } else {
        if (driverOnly.has(current) || adminOnly.has(current)) {
          router.replace('/(tabs)/available-trips' as any);
          return;
        }
      }
    }
  }, [loading, role, segments, token]);

  if (loading) {
    return null;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <AuthGate>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthGate>
    </AuthProvider>
  );
}
