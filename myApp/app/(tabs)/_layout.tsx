import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { useAuth } from '@/lib/auth';

export default function TabLayout() {
  const { role } = useAuth();

  // Tabs pour USER
  if (role === 'USER') {
    return (
      <Tabs screenOptions={{ headerShown: true }}>
        <Tabs.Screen
          name="available-trips"
          options={{
            title: 'Trajets',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="my-trips"
          options={{
            title: 'Mes trajets',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="drivers"
          options={{
            title: 'Chauffeurs',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="complaints"
          options={{
            title: 'Plaintes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="warning" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Compte',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        {/* Cacher les autres écrans */}
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
        <Tabs.Screen name="driver-dashboard" options={{ href: null }} />
        <Tabs.Screen name="create-trip" options={{ href: null }} />
        <Tabs.Screen name="trips" options={{ href: null }} />
        <Tabs.Screen name="wallet" options={{ href: null }} />
        <Tabs.Screen name="location" options={{ href: null }} />
        <Tabs.Screen name="admin-dashboard" options={{ href: null }} />
        <Tabs.Screen name="admin-drivers" options={{ href: null }} />
        <Tabs.Screen name="admin-trips" options={{ href: null }} />
        <Tabs.Screen name="admin-complaints" options={{ href: null }} />
        <Tabs.Screen name="admin-wallet" options={{ href: null }} />
      </Tabs>
    );
  }

  // Tabs pour DRIVER
  if (role === 'DRIVER') {
    return (
      <Tabs screenOptions={{ headerShown: true }}>
        <Tabs.Screen
          name="driver-dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="create-trip"
          options={{
            title: 'Créer',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="trips"
          options={{
            title: 'Trajets',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="car" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Wallet',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="location"
          options={{
            title: 'Position',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="location" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Compte',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        {/* Cacher les autres écrans */}
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
        <Tabs.Screen name="complaints" options={{ href: null }} />
        <Tabs.Screen name="available-trips" options={{ href: null }} />
        <Tabs.Screen name="my-trips" options={{ href: null }} />
        <Tabs.Screen name="drivers" options={{ href: null }} />
        <Tabs.Screen name="admin-dashboard" options={{ href: null }} />
        <Tabs.Screen name="admin-drivers" options={{ href: null }} />
        <Tabs.Screen name="admin-trips" options={{ href: null }} />
        <Tabs.Screen name="admin-complaints" options={{ href: null }} />
        <Tabs.Screen name="admin-wallet" options={{ href: null }} />
      </Tabs>
    );
  }

  // Tabs pour ADMIN
  if (role === 'ADMIN') {
    return (
      <Tabs screenOptions={{ headerShown: true }}>
        <Tabs.Screen
          name="admin-dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="admin-drivers"
          options={{
            title: 'Drivers',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="admin-trips"
          options={{
            title: 'Trips',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="car" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="admin-complaints"
          options={{
            title: 'Plaintes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="warning" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="admin-wallet"
          options={{
            title: 'Wallet',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Compte',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        {/* Cacher les autres écrans */}
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
        <Tabs.Screen name="driver-dashboard" options={{ href: null }} />
        <Tabs.Screen name="create-trip" options={{ href: null }} />
        <Tabs.Screen name="trips" options={{ href: null }} />
        <Tabs.Screen name="wallet" options={{ href: null }} />
        <Tabs.Screen name="location" options={{ href: null }} />
        <Tabs.Screen name="complaints" options={{ href: null }} />
        <Tabs.Screen name="available-trips" options={{ href: null }} />
        <Tabs.Screen name="my-trips" options={{ href: null }} />
        <Tabs.Screen name="drivers" options={{ href: null }} />
      </Tabs>
    );
  }

  // Fallback - pas de rôle
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen
        name="account"
        options={{
          title: 'Compte',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="driver-dashboard" options={{ href: null }} />
      <Tabs.Screen name="create-trip" options={{ href: null }} />
      <Tabs.Screen name="trips" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="location" options={{ href: null }} />
      <Tabs.Screen name="complaints" options={{ href: null }} />
      <Tabs.Screen name="available-trips" options={{ href: null }} />
      <Tabs.Screen name="my-trips" options={{ href: null }} />
      <Tabs.Screen name="drivers" options={{ href: null }} />
      <Tabs.Screen name="admin-dashboard" options={{ href: null }} />
      <Tabs.Screen name="admin-drivers" options={{ href: null }} />
      <Tabs.Screen name="admin-trips" options={{ href: null }} />
      <Tabs.Screen name="admin-complaints" options={{ href: null }} />
      <Tabs.Screen name="admin-wallet" options={{ href: null }} />
    </Tabs>
  );
}
