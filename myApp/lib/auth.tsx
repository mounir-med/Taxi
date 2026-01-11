import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { apiRequest, type ApiError } from '@/lib/api';

export type Role = 'USER' | 'DRIVER' | 'ADMIN';

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: string;
  [key: string]: unknown;
};

type AuthState = {
  loading: boolean;
  token: string | null;
  role: Role | null;
  profile: AuthUser | null;
  selectedRole: Role;
};

type LoginInput = {
  role: Role;
  email: string;
  password: string;
};

type RegisterInput = {
  role: Role;
  email: string;
  password: string;
  name: string;
  phone?: string;
  licenseNumber?: string;
  vehicleInfo?: string;
};

type AuthContextValue = AuthState & {
  setSelectedRole: (role: Role) => void;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const TOKEN_KEY = 'auth_token';
const ROLE_KEY = 'auth_role';
const PROFILE_KEY = 'auth_profile';

const AuthContext = createContext<AuthContextValue | null>(null);

function roleToPathPart(role: Role): 'user' | 'driver' | 'admin' {
  if (role === 'USER') return 'user';
  if (role === 'DRIVER') return 'driver';
  return 'admin';
}

function inferRole(payload: any, profile: AuthUser | null, fallback: Role): Role {
  if (payload && typeof payload === 'object') {
    if (payload.user) return 'USER';
    if (payload.driver) return 'DRIVER';
    if (payload.admin) return 'ADMIN';
  }
  const r = profile && typeof profile.role === 'string' ? profile.role : null;
  if (r === 'USER' || r === 'DRIVER' || r === 'ADMIN') return r;
  return fallback;
}

function roleFromJwt(token: string): Role | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;

    const atobFn: ((data: string) => string) | undefined = (globalThis as any)?.atob;
    if (!atobFn) return null;

    const json = atobFn(padded);
    const payload = JSON.parse(json);
    const r = payload && typeof payload.role === 'string' ? payload.role : null;
    if (r === 'USER' || r === 'DRIVER' || r === 'ADMIN') return r;
    return null;
  } catch {
    return null;
  }
}

function extractProfile(payload: any): AuthUser | null {
  if (!payload || typeof payload !== 'object') return null;
  return payload.user || payload.driver || payload.admin || null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('USER');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [storedToken, storedRole, storedProfile] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(ROLE_KEY),
          SecureStore.getItemAsync(PROFILE_KEY),
        ]);

        if (!mounted) return;

        if (storedToken) {
          setToken(storedToken);
        }

        let parsedProfile: AuthUser | null = null;
        if (storedProfile) {
          try {
            parsedProfile = JSON.parse(storedProfile);
          } catch {
            parsedProfile = null;
          }
          setProfile(parsedProfile);
        }

        const tokenRole = storedToken ? roleFromJwt(storedToken) : null;
        if (tokenRole) {
          setRole(tokenRole);
          setSelectedRole(tokenRole);
          return;
        }

        const roleFromProfile = parsedProfile && typeof parsedProfile.role === 'string' ? parsedProfile.role : null;
        if (roleFromProfile === 'USER' || roleFromProfile === 'DRIVER' || roleFromProfile === 'ADMIN') {
          setRole(roleFromProfile);
          setSelectedRole(roleFromProfile);
        } else if (storedRole === 'USER' || storedRole === 'DRIVER' || storedRole === 'ADMIN') {
          setRole(storedRole);
          setSelectedRole(storedRole);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (nextToken: string | null, nextRole: Role | null, nextProfile: AuthUser | null) => {
    if (nextToken) {
      await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }

    if (nextRole) {
      await SecureStore.setItemAsync(ROLE_KEY, nextRole);
    } else {
      await SecureStore.deleteItemAsync(ROLE_KEY);
    }

    if (nextProfile) {
      await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(nextProfile));
    } else {
      await SecureStore.deleteItemAsync(PROFILE_KEY);
    }
  }, []);

  const login = useCallback(
    async ({ role: inputRole, email, password }: LoginInput) => {
      const path = roleToPathPart(inputRole);
      const payload = await apiRequest<any>(`/api/auth/login/${path}`, {
        method: 'POST',
        body: { email, password },
      });

      const nextToken: string | null = typeof payload?.token === 'string' ? payload.token : null;
      if (!nextToken) {
        const err: ApiError = { status: 500, message: 'Token manquant dans la réponse', details: payload };
        throw err;
      }

      const nextProfile = extractProfile(payload);
      const nextRole = inferRole(payload, nextProfile, inputRole);

      setToken(nextToken);
      setRole(nextRole);
      setSelectedRole(nextRole);
      setProfile(nextProfile);

      await persist(nextToken, nextRole, nextProfile);
    },
    [persist]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const path = roleToPathPart(input.role);

      const body: Record<string, unknown> = {
        email: input.email,
        password: input.password,
        name: input.name,
      };

      if (input.role === 'USER') {
        body.phone = input.phone;
      }

      if (input.role === 'DRIVER') {
        body.phone = input.phone;
        body.licenseNumber = input.licenseNumber;
        body.vehicleInfo = input.vehicleInfo;
      }

      const payload = await apiRequest<any>(`/api/auth/register/${path}`, {
        method: 'POST',
        body,
      });

      const nextToken: string | null = typeof payload?.token === 'string' ? payload.token : null;
      if (!nextToken) {
        const err: ApiError = { status: 500, message: 'Token manquant dans la réponse', details: payload };
        throw err;
      }

      const nextProfile = extractProfile(payload);
      const nextRole = inferRole(payload, nextProfile, input.role);

      setToken(nextToken);
      setRole(nextRole);
      setSelectedRole(nextRole);
      setProfile(nextProfile);

      await persist(nextToken, nextRole, nextProfile);
    },
    [persist]
  );

  const logout = useCallback(async () => {
    try {
      if (token && role) {
        const path = roleToPathPart(role);
        await apiRequest(`/api/auth/logout/${path}`, {
          method: 'POST',
          token,
        });
      }
    } catch {
    } finally {
      setToken(null);
      setRole(null);
      setProfile(null);
      await persist(null, null, null);
    }
  }, [persist, role, token]);

  const refreshProfile = useCallback(async () => {
    if (!token || !role) return;
    const path = roleToPathPart(role);
    const payload = await apiRequest<any>(`/api/auth/profile/${path}`, { token });
    const nextProfile = payload && typeof payload === 'object' ? (payload as AuthUser) : null;
    setProfile(nextProfile);
    await persist(token, role, nextProfile);
  }, [persist, role, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      token,
      role,
      profile,
      selectedRole,
      setSelectedRole,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [loading, token, role, profile, selectedRole, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
