 import axios from 'axios';

const TOKEN_KEY = 'proyecto3_token';
const REFRESH_KEY = 'proyecto3_refresh';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
export const setRefreshToken = (token) => localStorage.setItem(REFRESH_KEY, token);

export function setTokens({ token, refreshToken }) {
  if (token) setToken(token);
  if (refreshToken) setRefreshToken(refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// Instancia central de Axios apuntando a la API (URL desde variable de entorno).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5149/api/v1',
  timeout: 20000,
});

// Extrae un mensaje de error legible desde una respuesta de Axios.
// Soporta ProblemDetails (RFC 7807), { message } y errores de validación.
export function getErrorMessage(error, fallback = 'Ocurrió un error inesperado.') {
  if (error?.code === 'ECONNABORTED') return 'La solicitud tardó demasiado. Intenta de nuevo.';
  const data = error?.response?.data;
  if (!data) return error?.message ?? fallback;
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (data.title) return data.title;
  if (data.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).flat()[0];
    if (first) return first;
  }
  return fallback;
}

// Interceptor de request: adjunta el token JWT en cada llamada si existe.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Renovación automática del access token con el refresh token.
// Usa "single-flight": si varias peticiones fallan a la vez con 401, solo se
// dispara UN refresh y las demás esperan su resultado.
// ---------------------------------------------------------------------------
let refreshPromise = null;

function forceLogout() {
  clearTokens();
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

async function refreshTokens() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('no refresh token');
  // Usa axios "crudo" (sin interceptores) para evitar recursión.
  const { data } = await axios.post(
    `${api.defaults.baseURL}/auth/refresh`,
    { refreshToken },
    { timeout: 20000 }
  );
  setTokens(data);
  return data.token;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Solo intentamos refrescar una vez, y no para las rutas de auth.
    const isAuthRoute = original?.url?.includes('/auth/');
    if (status === 401 && !original?._retry && !isAuthRoute && getRefreshToken()) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise ?? refreshTokens();
        const newToken = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        refreshPromise = null;
        forceLogout();
        return Promise.reject(error);
      }
    }

    // 401 sin posibilidad de refrescar -> cerrar sesión.
    if (status === 401 && getToken() && !isAuthRoute) {
      forceLogout();
    }
    return Promise.reject(error);
  }
);

export default api;
