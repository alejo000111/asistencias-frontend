import { ref, computed } from 'vue';
import router from '@/router';

// Estado reactivo centralizado para la sesión
const token = ref(localStorage.getItem('authToken') || '');
const role = ref(localStorage.getItem('authRole') || '');
const username = ref(localStorage.getItem('authUsername') || '');
const sedes = ref(JSON.parse(localStorage.getItem('authSedes') || '[]'));

/**
 * Decodifica la carga útil (payload) de un token JWT en formato Base64.
 */
function parseJwt(jwtToken) {
  try {
    if (!jwtToken || typeof jwtToken !== 'string') return null;
    const parts = jwtToken.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * Verifica de forma estricta si existe un token JWT válido y no expirado.
 */
export function isTokenValid() {
  const t = token.value || localStorage.getItem('authToken');
  if (!t || t === 'null' || t === 'undefined' || t.trim() === '') {
    return false;
  }

  // Verificar la marca de tiempo 'exp' contenida dentro del JWT
  const payload = parseJwt(t);
  if (payload && payload.exp) {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (nowInSeconds >= payload.exp) {
      console.warn('🔒 Sesión expirada por timestamp JWT (exp).');
      return false;
    }
  }

  return true;
}

export function isAuthenticated() {
  return isTokenValid();
}

export function isAdmin() {
  if (!isTokenValid()) return false;
  const r = role.value || localStorage.getItem('authRole');
  return r === 'ADMIN' || r === 'ROLE_ADMIN';
}

export function isSuperAdmin() {
  if (!isTokenValid()) return false;
  const r = role.value || localStorage.getItem('authRole');
  return r === 'SUPERADMIN' || r === 'ROLE_SUPERADMIN';
}

export function getAuthUsername() {
  return username.value || localStorage.getItem('authUsername') || '';
}

export function getAuthSedes() {
  try {
    return sedes.value.length ? sedes.value : JSON.parse(localStorage.getItem('authSedes') || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Guarda los datos de autenticación al iniciar sesión.
 */
export function setSession(data) {
  token.value = data.token || '';
  role.value = data.role || '';
  username.value = data.username || '';
  sedes.value = data.sedesAutorizadas || [];

  localStorage.setItem('authToken', token.value);
  localStorage.setItem('authRole', role.value);
  localStorage.setItem('authUsername', username.value);
  localStorage.setItem('authSedes', JSON.stringify(sedes.value));
}

/**
 * Limpia totalmente la sesión y redirige inmediatamente al login.
 */
export function clearSession() {
  token.value = '';
  role.value = '';
  username.value = '';
  sedes.value = [];

  localStorage.removeItem('authToken');
  localStorage.removeItem('authRole');
  localStorage.removeItem('authUsername');
  localStorage.removeItem('authSedes');
  localStorage.clear();

  if (router && router.currentRoute.value.name !== 'login' && !router.currentRoute.value.meta?.public) {
    router.push({ name: 'login' });
  }
}

export const useAuth = () => {
  return {
    token,
    role,
    username,
    sedes,
    isTokenValid,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    getAuthUsername,
    getAuthSedes,
    setSession,
    clearSession
  };
};
