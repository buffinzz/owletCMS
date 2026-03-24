import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { canEditContent } from './roleUtils';

interface AuthUser {
  username: string;
  role: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, token: string, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  canEdit: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (username: string, token: string, role: string) => {
    setUser({ username, token, role });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      canEdit: canEditContent(user?.role),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
