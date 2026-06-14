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
          <div class="navbar-nav align-items-center">
          <span class="text-light opacity-75 me-3 small" v-if="nombreUsuario">
            👤 Hola, <strong>{{ nombreUsuario }}</strong>
          </span>
          <button class="btn btn-outline-light btn-sm opacity-75 d-flex align-items-center gap-1" @click="cerrarSesion" style="transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.75'">
            🚪 Salir
          </button>
        </div>
      </div>
    </div>
  </nav>

  <div class="container">
    <!-- Usuarios no autenticados (login, portal), ADMIN, o sedes cargadas -->
    <template v-if="!autenticado || esAdmin || sedesCargadas">
      <!-- Bloqueo por sede inactiva (solo EMPLEADO autenticado) -->
      <div v-if="autenticado && !esAdmin && sedesBloqueadas" class="card shadow-sm border-warning mt-4" style="background-color: #fff3cd;">
        <div class="card-body text-center py-5">
          <div class="display-1 mb-4">🚫</div>
          <h4 class="text-warning fw-bold mb-3">Sede Deshabilitada</h4>
          <p class="lead mb-4" style="max-width: 500px; margin: 0 auto; color: #664d03;">
            Esta sede fue eliminada o deshabilitada por el administrador.
            Contacte a soporte para más información y reasignación.
          </p>
        </div>
      </div>
      <RouterView v-else />
    </template>
    <!-- EMPLEADO mientras carga sedes: pantalla de carga (evita flash de contenido) -->
    <template v-else>
      <div class="text-center mt-5 py-5">
        <div class="spinner-border text-warning mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
        <p class="text-muted">Verificando estado de la sede...</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

// Estado reactivo sincronizado con localStorage
const esPortal = ref(false);
const autenticado = ref(false);
const esAdmin = ref(false);
const nombreUsuario = ref('');
const sedesCargadas = ref(false);
const sedesDisponibles = ref([]);

// Computed: todas las sedes del empleado estÃ¡n inactivas
const sedesBloqueadas = computed(() => {
  if (esAdmin.value) return false; // Admin nunca se bloquea
  if (!autenticado.value) return false;
  return sedesDisponibles.value.length > 0 && sedesDisponibles.value.every(s => s.activa === false);
});

// Cargar sedes al montar para verificar estado de actividad
const cargarSedes = async () => {
  try {
    const res = await axios.get('/api/sedes');
    sedesDisponibles.value = res.data;
  } catch (e) {
    console.error('Error al cargar sedes para bloqueo:', e);
  } finally {
    sedesCargadas.value = true;
  }
};

// FunciÃ³n helper para normalizar el rol (Spring Security envÃ­a 'ADMIN', pero por si acaso)
function comprobarAdmin(rol) {
  return rol === 'ADMIN' || rol === 'ROLE_ADMIN';
}

// Refrescar estado desde localStorage en cada navegaciÃ³n
function sincronizarSesion() {
  esPortal.value = route.path.startsWith('/portal');
  autenticado.value = !!localStorage.getItem('authToken');
  esAdmin.value = comprobarAdmin(localStorage.getItem('authRole'));
  nombreUsuario.value = localStorage.getItem('authUsername') || '';
}

// Escuchar cambios de ruta para actualizar el navbar instantÃ¡neamente
watch(() => route.path, sincronizarSesion, { immediate: true });

// Cargar sedes despuÃ©s del login para verificar bloqueo
watch(autenticado, (val) => {
  if (val && !esAdmin.value) {
    cargarSedes();
  }
}, { immediate: true });

const cerrarSesion = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authRole');
  localStorage.removeItem('authSedes');
  localStorage.removeItem('authUsername');
  router.push({ name: 'login' }); // El watch se encarga de sincronizar
};
</script>

<style>
body {
  background-color: #f8f9fa;
}
</style>