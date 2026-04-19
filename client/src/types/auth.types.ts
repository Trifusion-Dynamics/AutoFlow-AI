export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  org: Organization | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
