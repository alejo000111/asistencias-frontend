import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './router'

// ============================================================
// 🎯 DETECCIÓN AUTOMÁTICA DE ENTORNO — Zero-Manual-Changes
// ============================================================
//
// En desarrollo local (npm run dev → import.meta.env.DEV === true):
//   → NO se configura baseURL.
//   → Axios usa rutas relativas:  GET /api/auth/login
//   → Vite proxy (vite.config.js) las redirige a localhost:8080.
//   → Sin CORS porque todo pasa por el mismo origen (localhost:5173).
//
// En producción o preview (npm run build → import.meta.env.PROD === true):
//   → Se lee VITE_API_URL desde .env.production o dashboard de Vercel.
//   → Axios apunta directamente al backend en Render.
//   → CORS se maneja desde SecurityConfig.java (backend).
//
// Variables de entorno:
//   .env.development  → vacío (usa proxy de Vite)
//   .env.production   → VITE_API_URL=https://<app>.onrender.com
//   Dashboard Vercel  → VITE_API_URL distinta por Target (Production / Preview)
// ============================================================

if (import.meta.env.PROD && import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}

import { clearSession } from '@/utils/auth';

// --- Interceptor de PETICIONES: inyectar token JWT ---
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// --- Interceptor de RESPUESTAS: manejo de errores, 401/403 y expiración de sesión ---
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // 401 = No autenticado o token inválido/expirado — purgar sesión y redirigir inmediatamente
        console.warn('⚠️ Petición 401 recibida: purgando sesión y redirigiendo a login...');
        clearSession();
        return Promise.reject(error);
      }

      if (status === 403) {
        // 403 = Autenticado pero sin permisos para este recurso.
        // NO se limpia la sesión, porque puede ser un error de código
        // (ej. EMPLEADO llamando a endpoint de ADMIN).
        // El componente que hizo la llamada debe manejar el error con try/catch.
        console.warn('⚠️ Acceso denegado (403) a', error.config?.url, '- el usuario no tiene permisos para este recurso.');
        return Promise.reject(error);
      }

      if (status >= 500) {
        // Error 500+ del backend — solo log, sin alert
        console.error('Error interno del servidor (500):', error.response.data);
      }
    } else {
      // Error de red (backend caido, timeout, etc.) — solo log
      console.error('Error de conexión con el servidor.', error);
    }
    return Promise.reject(error);
  }
);

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
