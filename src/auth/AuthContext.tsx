import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { usersApi } from '../api/endpoints';
import { clearToken, getToken, setToken as persistToken } from '../api/client';
import { decodeJwt } from './jwt';

interface AuthUser {
  id: string;
  email?: string;
  role: 'Player' | 'Admin';
}

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function userFromToken(token: string | null): AuthUser | null {
  if (!token) return null;
  const claims = decodeJwt(token);
  if (!claims) return null;
  return { id: claims.sub, email: claims.email, role: claims.role === 'Admin' ? 'Admin' : 'Player' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => userFromToken(getToken()));

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAdmin: user?.role === 'Admin',
      login: (token: string) => {
        persistToken(token);
        setUser(userFromToken(token));
      },
      logout: () => {
        // Best-effort server-side revocation — fired before clearing the
        // token (so it's still attached as the Authorization header) but
        // never awaited, so a network hiccup can't strand the user
        // mid-logout. Local state is cleared unconditionally either way.
        void usersApi.logout().catch(() => {});
        clearToken();
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
