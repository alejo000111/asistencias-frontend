<template>
  <!-- ====== NAVBAR ====== -->
  <nav v-if="!esPortal && autenticado" class="navbar-premium">
    <div class="app-container">
      <div class="navbar-premium__inner">
        <span class="navbar-premium__brand">Asistencias ERP</span>

        <button
          class="navbar-premium__toggle"
          @click="menuAbierto = !menuAbierto"
          aria-label="Toggle menu"
        >
          <span v-if="!menuAbierto">☰</span>
          <span v-else>✕</span>
        </button>

        <div class="navbar-premium__nav" :class="{ 'navbar-premium__nav--open': menuAbierto }">
          <RouterLink class="navbar-premium__link" to="/" @click="menuAbierto = false">
            📝 Asistencia
          </RouterLink>
          <RouterLink class="navbar-premium__link" to="/historial-asistencias" @click="menuAbierto = false">
            📅 Historial
          </RouterLink>
          <RouterLink class="navbar-premium__link" to="/clientes" @click="menuAbierto = false">
            👥 Clientes
          </RouterLink>
          <RouterLink class="navbar-premium__link" to="/registro" @click="menuAbierto = false">
            ➕ Inscripciones
          </RouterLink>
          <RouterLink v-if="esAdmin" class="navbar-premium__link" to="/caja" @click="menuAbierto = false">
            📊 Caja
          </RouterLink>
          <RouterLink v-if="esAdmin" class="navbar-premium__link" to="/gestion-sedes" @click="menuAbierto = false">
            🏢 Sedes
          </RouterLink>
          <RouterLink v-if="esAdmin" class="navbar-premium__link" to="/gestion-empleados" @click="menuAbierto = false">
            👤 Empleados
          </RouterLink>
          <RouterLink v-if="esAdmin" class="navbar-premium__link" to="/ajustes-cobros" @click="menuAbierto = false">
            💰 Cobros
          </RouterLink>
          <!-- SuperAdmin exclusivo -->
          <RouterLink v-if="esSuperAdmin" class="navbar-premium__link navbar-premium__link--superadmin" to="/superadmin" @click="menuAbierto = false">
            ⚡ SuperAdmin
          </RouterLink>
          <!-- Botón Salir para móviles -->
          <button class="navbar-premium__link navbar-premium__logout-mobile border-0 bg-transparent text-start w-100 d-md-none" @click="cerrarSesionAndCloseMenu" style="cursor: pointer;">
            🚪 Salir
          </button>
        </div>

        <div class="navbar-premium__right">
          <span v-if="nombreUsuario" class="navbar-premium__user">
            <span class="navbar-premium__user-avatar">{{ nombreUsuario.charAt(0).toUpperCase() }}</span>
            <span class="navbar-premium__user-name">{{ nombreUsuario }}</span>
          </span>
          <button class="navbar-premium__logout" @click="cerrarSesion" title="Cerrar sesión">
            <span class="navbar-premium__logout-icon">🚪</span>
            <span class="navbar-premium__logout-text">Salir</span>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- ====== MAIN CONTENT ====== -->
  <main class="app-main">
    <div class="app-container">
      <!-- Usuarios no autenticados (login, portal), ADMIN, o sedes cargadas -->
      <template v-if="!autenticado || esAdmin || sedesCargadas">
        <!-- Bloqueo por sede inactiva (solo EMPLEADO autenticado) -->
        <div v-if="autenticado && !esAdmin && sedesBloqueadasForEmp" class="card-premium" style="margin-top: var(--space-8); text-align: center; padding: var(--space-12) var(--space-6);">
          <div style="font-size: 3rem; margin-bottom: var(--space-4);">🚫</div>
          <h3 style="color: var(--orange-500); margin-bottom: var(--space-3);">Sede Deshabilitada</h3>
          <p style="max-width: 480px; margin: 0 auto; color: var(--text-secondary);">
            Esta sede fue eliminada o deshabilitada por el administrador.
            Contacte a soporte para más información y reasignación.
          </p>
        </div>
        <RouterView v-else />
      </template>
      <!-- EMPLEADO mientras carga sedes -->
      <template v-else>
        <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-12) 0;">
          <div class="spinner-premium"></div>
          <p style="color: var(--text-secondary);">Verificando estado de la sede...</p>
        </div>
      </template>
    </div>
  </main>

  <!-- ====== 🌙 DARK MODE FAB ====== -->
  <button
    class="theme-fab"
    :aria-label="theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'"
    :title="theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'"
    @click="toggleTheme"
  >
    <span class="theme-fab__icon" :class="{ 'theme-fab__icon--animating': themeAnimating }">
      {{ theme === 'dark' ? '☀️' : '🌙' }}
    </span>
  </button>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import axios from 'axios';

import { isAuthenticated, isAdmin as checkAdmin, isSuperAdmin as checkSuperAdmin, getAuthUsername, clearSession } from '@/utils/auth';

const route = useRoute();
const router = useRouter();

const menuAbierto = ref(false);

// Estado reactivo sincronizado con el módulo auth
const esPortal = ref(false);
const autenticado = ref(false);
const esAdmin = ref(false);
const esSuperAdmin = ref(false);
const nombreUsuario = ref('');

import { useSedes } from '@/utils/useSedes';
const { sedes: sedesDisponibles, sedesCargadas, sedesBloqueadas, cargarSedes } = useSedes();

// Sedes bloqueadas: solo para EMPLEADO; ADMIN siempre pasa
const sedesBloqueadasForEmp = computed(() => {
  if (esAdmin.value) return false;
  if (!autenticado.value) return false;
  return sedesBloqueadas.value;
});

function cerrarSesion() {
  menuAbierto.value = false;
  autenticado.value = false;
  esAdmin.value = false;
  nombreUsuario.value = '';
  clearSession();
}

function cerrarSesionAndCloseMenu() {
  menuAbierto.value = false;
  cerrarSesion();
}

function sincronizarSesion() {
  const path = route.path || '';
  const tokenValido = isAuthenticated();
  esPortal.value = path.startsWith('/portal');
  autenticado.value = tokenValido;
  esAdmin.value = checkAdmin();
  esSuperAdmin.value = checkSuperAdmin();
  nombreUsuario.value = getAuthUsername();

  // Redirección inmediata al login si NO hay sesión válida y no es ruta pública/login
  if (!esPortal.value && route.name !== 'login' && !tokenValido) {
    cerrarSesion();
  }
}

watch(() => route.path, sincronizarSesion, { immediate: true });

// ============================================================
// ⏱️ AUTO LOGOUT POR INACTIVIDAD (10 minutos = 600,000 ms)
// ============================================================
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
let inactivityTimer = null;

function resetInactivityTimer() {
  if (!autenticado.value || esPortal.value) {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    return;
  }

  if (inactivityTimer) clearTimeout(inactivityTimer);

  inactivityTimer = setTimeout(() => {
    if (autenticado.value && !esPortal.value) {
      alert("⚠️ Tu sesión se ha cerrado automáticamente por 10 minutos de inactividad. Por favor inicia sesión nuevamente.");
      cerrarSesion();
    }
  }, INACTIVITY_TIMEOUT_MS);
}

function handleUserActivity() {
  resetInactivityTimer();
}

watch(autenticado, (val) => {
  if (val && !esAdmin.value) {
    cargarSedes();
  } else if (esAdmin.value) {
    sedesCargadas.value = true;
  }

  if (val) {
    resetInactivityTimer();
  } else {
    if (inactivityTimer) clearTimeout(inactivityTimer);
  }
}, { immediate: true });

// ============================================================
// 🌙 DARK MODE — Theme Toggle
// ============================================================
const theme = ref('light');
const themeAnimating = ref(false);

function applyTheme(t) {
  theme.value = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}

function toggleTheme() {
  const next = theme.value === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  // Dispara animación en ambos sentidos
  themeAnimating.value = true;
  setTimeout(() => { themeAnimating.value = false; }, 400);
}

onMounted(() => {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
  } else {
    applyTheme('light');
  }
  window.addEventListener('storage', sincronizarSesion);

  // Escuchar actividad del usuario para reiniciar temporizador de inactividad
  const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
  activityEvents.forEach(evt => {
    window.addEventListener(evt, handleUserActivity, { passive: true });
  });

  resetInactivityTimer();
});

onUnmounted(() => {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
  activityEvents.forEach(evt => {
    window.removeEventListener(evt, handleUserActivity);
  });
});
</script>

<style>
/* ============================================================
   🏪 NAVBAR PREMIUM
   ============================================================ */
.navbar-premium {
  background: var(--navbar-bg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.navbar-premium__inner {
  display: flex;
  align-items: center;
  height: 60px;
  gap: var(--space-4);
}

.navbar-premium__brand {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-white);
  white-space: nowrap;
  flex-shrink: 0;
}

.navbar-premium__toggle {
  display: none;
  background: none;
  border: none;
  color: var(--gray-400);
  font-size: 1.25rem;
  cursor: pointer;
  padding: var(--space-1);
  margin-left: auto;
}

/* Navegación central */
.navbar-premium__nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex: 1;
}

.navbar-premium__link {
  padding: var(--space-2) var(--space-3);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-400);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  white-space: nowrap;
  text-decoration: none;
}

.navbar-premium__link:hover {
  color: var(--color-white);
  background: rgba(255, 255, 255, 0.06);
}

.navbar-premium__link.router-link-active {
  color: var(--orange-400);
  background: rgba(249, 115, 22, 0.08);
}

/* Sección derecha (usuario + salir) */
.navbar-premium__right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.navbar-premium__user {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--gray-300);
  font-size: 0.875rem;
}

.navbar-premium__user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  background: var(--orange-500);
  color: var(--color-white);
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.navbar-premium__user-name {
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .navbar-premium__toggle {
    display: block;
  }

  .navbar-premium__nav {
    display: none;
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    flex-direction: column;
    background: var(--navbar-bg);
    padding: var(--space-3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    gap: var(--space-1);
  }

  .navbar-premium__nav--open {
    display: flex;
  }

  .navbar-premium__link {
    width: 100%;
    padding: var(--space-3);
  }

  .navbar-premium__right {
    display: none;
  }

  .navbar-premium__nav--open ~ .navbar-premium__right {
    display: none;
  }
}

/* Botón Salir ghost premium */
.navbar-premium__logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--gray-400);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  line-height: 1;
}

.navbar-premium__logout:hover {
  color: var(--color-white);
  background: rgba(255, 255, 255, 0.06);
}

.navbar-premium__logout-icon {
  font-size: 0.9rem;
  opacity: 0.8;
}

.navbar-premium__logout:hover .navbar-premium__logout-icon {
  opacity: 1;
}

@media (max-width: 768px) {
  .navbar-premium__logout {
    padding: var(--space-3);
  }
  .navbar-premium__logout-text {
    display: none;
  }
  .navbar-premium__logout-icon {
    font-size: 1.1rem;
    opacity: 0.8;
  }
}

/* ============================================================
   🌙 THEME FAB — Floating Action Button
   ============================================================ */
.theme-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  min-width: 56px;
  min-height: 56px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--navbar-bg);
  color: var(--gray-300);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all var(--transition-normal);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.theme-fab:focus-visible {
  outline: 2px solid var(--orange-500);
  outline-offset: 3px;
}

.theme-fab:hover {
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2);
  color: var(--orange-400);
}

.theme-fab:active {
  transform: scale(0.95);
}

.theme-fab__icon {
  font-size: 1.95rem;
  line-height: 1;
  transition: transform var(--transition-normal);
  display: inline-block;
}

.theme-fab__icon--animating {
  animation: spin-reveal 0.35s ease;
}

@keyframes spin-reveal {
  0% {
    transform: rotate(-90deg) scale(0.6);
    opacity: 0.4;
  }
  100% {
    transform: rotate(0deg) scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .theme-fab {
    width: 62px;
    height: 62px;
    min-width: 62px;
    min-height: 62px;
    bottom: 20px;
    right: 20px;
  }
  .theme-fab__icon {
    font-size: 2.2rem;
  }
}



/* ============================================================
   📐 MAIN LAYOUT
   ============================================================ */
.app-main {
  padding: var(--space-3) 0;
  min-height: calc(100vh - 60px);
}

@media (min-width: 768px) {
  .app-main {
    padding: var(--space-4) 0;
  }
}

/* ============================================================
   ⚡ SUPERADMIN — Enlace especial en navbar
   ============================================================ */
.navbar-premium__link--superadmin {
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.15), rgba(251, 146, 60, 0.10)) !important;
  border: 1px solid rgba(250, 204, 21, 0.3) !important;
  color: #fbbf24 !important;
  border-radius: var(--radius-md);
  font-weight: 600 !important;
  letter-spacing: 0.01em;
  transition: all var(--transition-normal);
}

.navbar-premium__link--superadmin:hover {
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.25), rgba(251, 146, 60, 0.18)) !important;
  border-color: rgba(250, 204, 21, 0.6) !important;
  color: #fde68a !important;
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.25);
}
</style>
