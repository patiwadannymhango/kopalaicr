import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { TeamAccount } from '../types';
import { clearAuthToken, getAuthToken } from '../api/http';
import { fetchMyTeamAccount } from '../api/teamAccountApi';
import { loginTeamAccount, logoutTeamAccount } from '../api/authApi';

interface AuthContextValue {
  team: TeamAccount | null;
  /** True only while the initial session check (on app load) is in
   * flight — lets RequireTeamAuth avoid a flash-redirect to /login before
   * a stored token has had a chance to resolve. */
  loading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTeam: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [team, setTeam] = useState<TeamAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshTeam = useCallback(async () => {
    if (!getAuthToken()) {
      setTeam(null);
      return;
    }
    try {
      const account = await fetchMyTeamAccount();
      setTeam(account);
    } catch {
      // Token missing, expired, or the backend is unreachable — treat all
      // of these as logged out rather than leaving a half-authenticated
      // UI state around.
      clearAuthToken();
      setTeam(null);
    }
  }, []);

  useEffect(() => {
    refreshTeam().finally(() => setLoading(false));
  }, [refreshTeam]);

  async function login(email: string, password: string) {
    await loginTeamAccount(email, password);
    await refreshTeam();
  }

  function logout() {
    logoutTeamAccount();
    setTeam(null);
  }

  return (
    <AuthContext.Provider value={{ team, loading, isLoggedIn: !!team, login, logout, refreshTeam }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
