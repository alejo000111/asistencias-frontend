<template>
  <nav v-if="!esPortal && autenticado" class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
    <div class="container">
      <span class="navbar-brand mb-0 h1 fw-bold text-warning" style="letter-spacing: 1px;">Programa Asistencias</span>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <div class="navbar-nav me-auto">
          <RouterLink class="nav-link" to="/">📝 Asistencia</RouterLink>
          <RouterLink class="nav-link" to="/historial-asistencias">📅 Historial Asistencias</RouterLink>
          <RouterLink class="nav-link" to="/clientes">👥 Clientes y Pagos</RouterLink>
          <RouterLink class="nav-link" to="/registro">➕ Inscripciones</RouterLink>
          <!-- Solo ADMIN -->
          <RouterLink v-if="esAdmin" class="nav-link" to="/caja">📊 Caja</RouterLink>
          <RouterLink v-if="esAdmin" class="nav-link" to="/gestion-sedes">🏢 Sedes</RouterLink>
          <RouterLink v-if="esAdmin" class="nav-link" to="/gestion-empleados">👤 Empleados</RouterLink>
        </div>
        <div class="navbar-nav">
          <span class="nav-link text-muted small" v-if="username">
            {{ esAdmin ? '🛡️' : '🧑‍💼' }} {{ username }}
          </span>
          <button class="nav-link btn btn-link text-danger" @click="cerrarSesion">🚪 Salir</button>
        </div>
      </div>
    </div>
  </nav>

  <div class="container">
    <RouterView />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const esPortal = computed(() => route.path.startsWith('/portal'));
const autenticado = computed(() => !!localStorage.getItem('authToken'));
const esAdmin = computed(() => localStorage.getItem('authRole') === 'ADMIN');
const username = computed(() => localStorage.getItem('authUsername') || '');

const cerrarSesion = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authRole');
  localStorage.removeItem('authSedes');
  localStorage.removeItem('authUsername');
  router.push({ name: 'login' });
};
</script>

<style>
body {
  background-color: #f8f9fa;
}
</style>