<template>
  <div class="container">
    <div class="row justify-content-center align-items-center" style="min-height: 80vh;">
      <div class="col-md-5 col-lg-4">
        <div class="card shadow-lg border-0 rounded-4">
          <div class="card-body p-4 p-md-5">
            <div class="text-center mb-4">
              <div class="display-6 mb-2">🔐</div>
              <h4 class="fw-bold text-dark">Iniciar Sesión</h4>
              <p class="text-muted small">Ingresa tus credenciales para acceder</p>
            </div>

            <div v-if="errorMsg" class="alert alert-danger py-2 small text-center">{{ errorMsg }}</div>

            <form @submit.prevent="login">
              <div class="mb-3">
                <label class="form-label fw-semibold small">Usuario</label>
                <input
                  type="text"
                  v-model="username"
                  class="form-control form-control-lg border-secondary"
                  placeholder="admin"
                  autocomplete="username"
                  required
                />
              </div>

              <div class="mb-4">
                <label class="form-label fw-semibold small">Contraseña</label>
                <input
                  type="password"
                  v-model="password"
                  class="form-control form-control-lg border-secondary"
                  placeholder="••••••"
                  autocomplete="current-password"
                  required
                />
              </div>

              <button type="submit" class="btn btn-dark btn-lg w-100 fw-bold shadow-sm" :disabled="cargando">
                {{ cargando ? '⏳ Ingresando...' : '🚀 Ingresar' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const username = ref('');
const password = ref('');
const cargando = ref(false);
const errorMsg = ref('');

const login = async () => {
  if (!username.value || !password.value) {
    errorMsg.value = 'Completa todos los campos';
    return;
  }

  cargando.value = true;
  errorMsg.value = '';

  try {
    const response = await axios.post('/api/auth/login', {
      username: username.value,
      password: password.value
    });

    const data = response.data;

    // Guardar datos de sesión
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('authRole', data.role);
    localStorage.setItem('authUsername', data.username);
    localStorage.setItem('authSedes', JSON.stringify(data.sedesAutorizadas || []));

    // Redirigir al dashboard
    router.push({ name: 'home' });
  } catch (error) {
    if (error.response && error.response.status === 401) {
      errorMsg.value = 'Usuario o contraseña incorrectos';
    } else {
      errorMsg.value = 'Error de conexión con el servidor';
    }
  } finally {
    cargando.value = false;
  }
};
</script>
