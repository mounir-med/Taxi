import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { role } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />

      <Tabs.Screen name="driver-dashboard" options={{ href: role === 'DRIVER' ? undefined : null }} />
      <Tabs.Screen name="create-trip" options={{ href: role === 'DRIVER' ? undefined : null }} />
      <Tabs.Screen name="trips" options={{ href: role === 'DRIVER' ? undefined : null }} />
      <Tabs.Screen name="wallet" options={{ href: role === 'DRIVER' ? undefined : null }} />
      <Tabs.Screen name="location" options={{ href: role === 'DRIVER' ? undefined : null }} />

      <Tabs.Screen name="available-trips" options={{ href: role === 'USER' ? undefined : null }} />
      <Tabs.Screen name="my-trips" options={{ href: role === 'USER' ? undefined : null }} />
      <Tabs.Screen name="drivers" options={{ href: role === 'USER' ? undefined : null }} />

      <Tabs.Screen name="complaints" options={{ href: role === 'USER' || role === 'DRIVER' ? undefined : null }} />

      <Tabs.Screen name="admin-dashboard" options={{ href: role === 'ADMIN' ? undefined : null }} />
      <Tabs.Screen name="admin-drivers" options={{ href: role === 'ADMIN' ? undefined : null }} />
      <Tabs.Screen name="admin-trips" options={{ href: role === 'ADMIN' ? undefined : null }} />
      <Tabs.Screen name="admin-complaints" options={{ href: role === 'ADMIN' ? undefined : null }} />
      <Tabs.Screen name="admin-wallet" options={{ href: role === 'ADMIN' ? undefined : null }} />
      {role === 'DRIVER' ? (
        <>
          <Tabs.Screen
            name="driver-dashboard"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="create-trip"
            options={{
              title: 'Créer',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="trips"
            options={{
              title: 'Mes trajets',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
            }}
          />
          <Tabs.Screen
            name="wallet"
            options={{
              title: 'Wallet',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="creditcard.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="location"
            options={{
              title: 'Localisation',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="location.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="complaints"
            options={{
              title: 'Réclamations',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="exclamationmark.bubble.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="account"
            options={{
              title: 'Compte',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
            }}
          />
        </>
      ) : role === 'ADMIN' ? (
        <>
          <Tabs.Screen
            name="admin-dashboard"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="admin-drivers"
            options={{
              title: 'Drivers',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="admin-trips"
            options={{
              title: 'Trips',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
            }}
          />
          <Tabs.Screen
            name="admin-complaints"
            options={{
              title: 'Réclamations',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="exclamationmark.bubble.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="admin-wallet"
            options={{
              title: 'Wallet',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="creditcard.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="account"
            options={{
              title: 'Compte',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
            }}
          />
        </>
      ) : role === 'USER' ? (
        <>
          <Tabs.Screen
            name="available-trips"
            options={{
              title: 'Trajets',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
            }}
          />
          <Tabs.Screen
            name="my-trips"
            options={{
              title: 'Mes trajets',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
            }}
          />
          <Tabs.Screen
            name="drivers"
            options={{
              title: 'Chauffeurs',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2" color={color} />,
            }}
          />
          <Tabs.Screen
            name="account"
            options={{
              title: 'Compte',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle" color={color} />,
            }}
          />
          <Tabs.Screen
            name="complaints"
            options={{
              title: 'Réclamations',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="exclamationmark.bubble" color={color} />,
            }}
          />
        </>
      ) : (
        <>
          <Tabs.Screen
            name="account"
            options={{
              title: 'Compte',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle" color={color} />,
            }}
          />
        </>
      )}
    </Tabs>
  );
}
