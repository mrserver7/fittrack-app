import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export type UserRole = "trainer" | "client" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isAdmin?: boolean;
  trainerId?: string;
  photoUrl?: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
}

const TOKEN_KEY = "fittrack_token";
const USER_KEY = "fittrack_user";

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  setAuth: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, user: null });
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      const user = userStr ? (JSON.parse(userStr) as AuthUser) : null;
      set({ token, user, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));

// Hydrate on import
useAuthStore.getState().hydrate();
