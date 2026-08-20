import { createContext, useContext, useEffect, useState } from 'react';
import api, { clearTokens, getRefreshToken, getToken, setTokens } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al cargar la app, si hay token guardado, recupera el perfil.
  useEffect(() => {
    async function loadUser() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch {
        clearTokens();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    setTokens(data);
    setUser(data.user);
    return data.user;
  }

  async function register(email, displayName, password) {
    const { data } = await api.post('/auth/register', { email, displayName, password });
    setTokens(data);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    const refreshToken = getRefreshToken();
    // Revoca el refresh token en el backend (best-effort).
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch {
        // Ignoramos errores de red: igual limpiamos la sesión local.
      }
    }
    clearTokens();
    setUser(null);
  }

  const value = { user, loading, login, register, logout, isAuthenticated: !!user };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
