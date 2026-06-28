import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './router'

axios.defaults.baseURL = import.meta.env.VITE_API_URL;

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
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token inválido/expirado o sin permisos — limpiar sesión y redirigir a login
      localStorage.clear();
      alert('⚠️ Tu sesión ha expirado o no tienes autorización. Redirigiendo al inicio de sesión...');
      router.push('/login');
      return Promise.reject(error);
    }

    if (!error.response) {
      // Error de red (backend caido, timeout, etc.) — solo log, sin alert (cada componente maneja su UI)
      console.error('Error de conexión con el servidor.', error);
    } else if (error.response.status >= 500) {
      // Error 500+ del backend — solo log, sin alert
      console.error('Error interno del servidor (500):', error.response.data);
    }
    return Promise.reject(error);
  }
);

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
