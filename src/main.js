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

// --- Interceptor de RESPUESTAS: manejo de errores y 401 ---
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Token inválido/expirado — limpiar sesión y redirigir a login
      localStorage.removeItem('authToken');
      localStorage.removeItem('authRole');
      localStorage.removeItem('authSedes');
      localStorage.removeItem('authUsername');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (!error.response) {
      // Error de red (backend caido, timeout, etc.)
      console.error('Error de conexión con el servidor. Revisa tu consola.', error);
      alert('Error de conexión con el servidor. Revisa tu consola.');
    } else if (error.response.status >= 500) {
      // Error 500+ del backend
      console.error('Error interno del servidor (500):', error.response.data);
      alert('Error interno del servidor. Revisa la consola para mas detalles.');
    }
    return Promise.reject(error);
  }
);

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
