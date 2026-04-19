import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "../api/client";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  orgId: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  tokenQuota: number;
  tokenUsed: number;
}

interface AuthState {
  user: User | null;
  org: Organization | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setAuth: (user: User, org: Organization, token: string, refreshToken: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      org: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, org, token, refreshToken) => {
        set({ 
          user, 
          org, 
          token, 
          refreshToken, 
          isAuthenticated: true 
        });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await apiClient.post("/auth/login", { email, password });
          const { user, organization, accessToken, refreshToken } = res.data.data;
          
          set({
            user,
            org: organization,
            token: accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Sync with legacy localStorage for axios interceptor
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await apiClient.post("/auth/register", data);
          const { user, organization, tokens } = res.data.data;
          
          set({
            user,
            org: organization,
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Sync with legacy localStorage for axios interceptor
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', tokens.accessToken);
            localStorage.setItem('refresh_token', tokens.refreshToken);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          org: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem("auth-storage");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      },

      fetchMe: async () => {
        const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
        if (!token) return;
        
        set({ isLoading: true });
        try {
          const res = await apiClient.get("/auth/me");
          const user = res.data.data;
          set({ 
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              orgId: user.orgId
            }, 
            org: user.org,
            isAuthenticated: true,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            user: null, 
            org: null, 
            token: null, 
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false 
          });
          if (typeof window !== 'undefined') {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
          }
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ 
        token: state.token, 
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
