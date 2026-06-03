import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'

import App from './App.vue'
import router from './router'

axios.defaults.baseURL = import.meta.env.VITE_API_URL;

// Interceptor global de respuestas — manejo de errores silenciosos
axios.interceptors.response.use(
  response => response,
  error => {
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
