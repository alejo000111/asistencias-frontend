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
          <!-- Módulos Operativos (Ocultos para SUPERADMIN) -->
          <template v-if="!esSuperAdmin">
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
          </template>

          <!-- SuperAdmin exclusivo en el Navbar principal -->
          <template v-if="esSuperAdmin">
            <button
              type="button"
              class="navbar-premium__link"
              :class="{ 'navbar-premium__link--active': currentSuperAdminTab === 'clubes' }"
              @click="irASuperAdminTab('clubes')"
            >
              🏢 Clubs Registrados
            </button>
            <button
              type="button"
              class="navbar-premium__link"
              :class="{ 'navbar-premium__link--active': currentSuperAdminTab === 'planes' }"
              @click="irASuperAdminTab('planes')"
            >
              💎 Planes
            </button>
            <button
              type="button"
              class="navbar-premium__link"
              :class="{ 'navbar-premium__link--active': currentSuperAdminTab === 'usuarios' }"
              @click="irASuperAdminTab('usuarios')"
            >
              👥 Usuarios Registrados
            </button>
          </template>
          <!-- Botón Salir para móviles -->
          <button class="navbar-premium__link navbar-premium__logout-mobile border-0 bg-transparent text-start w-100 d-md-none" @click="cerrarSesionAndCloseMenu" style="cursor: pointer;">
            🚪 Salir
          </button>
        </div>

        <div class="navbar-premium__right">
          <div class="navbar-premium__user-dropdown-container">
            <button class="navbar-premium__user-btn" @click="toggleUserMenu" :aria-expanded="userMenuOpen">
              <span class="navbar-premium__user-avatar">{{ nombreUsuario.charAt(0).toUpperCase() }}</span>
              <span class="navbar-premium__user-name">{{ nombreUsuario }}</span>
              <span class="navbar-premium__dropdown-arrow">▼</span>
            </button>
            <div v-if="userMenuOpen" class="navbar-premium__user-dropdown" @click.stop>
              <!-- Accesos directos para ADMIN de Club -->
              <template v-if="esAdmin">
                <router-link to="/gestion-sedes" class="navbar-premium__dropdown-item" @click="userMenuOpen = false">
                  🏢 Gestión de Sedes
                </router-link>
                <router-link to="/gestion-empleados" class="navbar-premium__dropdown-item" @click="userMenuOpen = false">
                  👤 Gestión de Empleados
                </router-link>
                <router-link to="/nomina" class="navbar-premium__dropdown-item" @click="userMenuOpen = false">
                  💵 Nómina
                </router-link>
                <router-link to="/ajustes-cobros" class="navbar-premium__dropdown-item" @click="userMenuOpen = false">
                  💰 Ajustes de Cobros
                </router-link>
              </template>

              <router-link to="/configuracion" class="navbar-premium__dropdown-item" @click="userMenuOpen = false">
                ⚙️ Configuración de Cuenta
              </router-link>
              <button class="navbar-premium__dropdown-item navbar-premium__dropdown-item--logout" @click="cerrarSesionUserMenu">
                🚪 Salir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- ====== MAIN CONTENT ====== -->
  <main class="app-main">
    <div class="app-container">
      <!-- Usuarios no autenticados (login, portal), ADMIN, o sedes cargadas -->
      <template v-if="!autenticado || esAdmin || sedesCargadas">
        <!-- Banner de Mora (Informativo y discreto) -->
        <div v-if="autenticado && !esSuperAdmin && clubSuspendido" class="alert-banner" style="background-color: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); padding: 12px 16px; text-align: center; border-radius: 8px; margin-bottom: 16px; font-weight: 600; font-size: 0.9rem;">
          ⚠️ Tu club está suspendido por plazo vencido. Por favor contacta a Alejandro para regularizar el pago y reactivar tu cuenta. Puedes seguir registrando asistencias y consultando la información normalmente.
        </div>
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
    <span
      class="theme-fab__icon"
      :class="[theme === 'dark' ? 'theme-fab__icon--sun' : 'theme-fab__icon--moon', { 'theme-fab__icon--animating': themeAnimating }]"
    >
      {{ theme === 'dark' ? '☀️' : '🌙' }}
    </span>
  </button>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import axios from 'axios';

import { isAuthenticated, isAdmin as checkAdmin, isSuperAdmin as checkSuperAdmin, getAuthUsername, clearSession, isClubSuspendido } from '@/utils/auth';

const route = useRoute();
const router = useRouter();

const currentSuperAdminTab = computed(() => route.query.tab || 'clubes');
const clubSuspendido = ref(false);

function irASuperAdminTab(tab) {
  menuAbierto.value = false;
  router.push({ path: '/superadmin', query: { tab } });
}

const menuAbierto = ref(false);
const userMenuOpen = ref(false);

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value;
}

function cerrarSesionUserMenu() {
  userMenuOpen.value = false;
  cerrarSesion();
}

// El dropdown del menú de perfil debe cerrarse al hacer clic en cualquier otro lugar de la
// página — antes solo se cerraba al elegir una opción, y quedaba sobrepuesto indefinidamente.
// Se ignoran los clics dentro del propio botón/panel (ese contenedor ya maneja su estado con
// toggleUserMenu y los @click de cada ítem) para no pelear con esos handlers.
function cerrarUserMenuAlClickAfuera(event) {
  if (!userMenuOpen.value) return;
  if (event.target.closest('.navbar-premium__user-dropdown-container')) return;
  userMenuOpen.value = false;
}

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
  clubSuspendido.value = isClubSuspendido();

  // Redirección inmediata al login si NO hay sesión válida y no es ruta pública/login
  if (!esPortal.value && route.name !== 'login' && !tokenValido) {
    cerrarSesion();
  }
}

watch(() => route.path, sincronizarSesion, { immediate: true });

// ============================================================
// ⏱️ GESTIÓN DE INACTIVIDAD (20 minutos)
// Se detecta actividad con: escribir, clics, tocar botones,
// navegar, scrolls, cambios de foco y peticiones al backend.
// ============================================================
const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;
let lastActivityTime = Date.now();
let lastStorageUpdate = 0;
let inactivityInterval = null;

function registrarActividad() {
  lastActivityTime = Date.now();
  if (lastActivityTime - lastStorageUpdate > 5000) {
    try {
      localStorage.setItem('lastUserActivity', String(lastActivityTime));
      lastStorageUpdate = lastActivityTime;
    } catch (e) {}
  }
}

function verificarInactividad() {
  if (!autenticado.value || esPortal.value) return;

  // Sincronizar actividad con otras pestañas si están activas
  let ultimaActividad = lastActivityTime;
  try {
    const guardada = localStorage.getItem('lastUserActivity');
    if (guardada) {
      const parsed = parseInt(guardada, 10);
      if (!isNaN(parsed) && parsed > ultimaActividad) {
        ultimaActividad = parsed;
        lastActivityTime = parsed;
      }
    }
  } catch (e) {}

  const inactivoMs = Date.now() - ultimaActividad;
  if (inactivoMs >= INACTIVITY_TIMEOUT_MS) {
    if (autenticado.value && !esPortal.value) {
      alert("⚠️ Tu sesión se ha cerrado automáticamente por 20 minutos de inactividad. Por favor inicia sesión nuevamente.");
      cerrarSesion();
    }
  }
}

function iniciarControlInactividad() {
  registrarActividad();
  if (inactivityInterval) clearInterval(inactivityInterval);
  inactivityInterval = setInterval(verificarInactividad, 10000);
}

function detenerControlInactividad() {
  if (inactivityInterval) {
    clearInterval(inactivityInterval);
    inactivityInterval = null;
  }
}

watch(autenticado, (val) => {
  if (val && !esAdmin.value) {
    cargarSedes();
  } else if (esAdmin.value) {
    sedesCargadas.value = true;
  }

  if (val) {
    iniciarControlInactividad();
  } else {
    detenerControlInactividad();
  }
}, { immediate: true });

// ============================================================
// 🌙 DARK MODE — Theme Toggle
// ============================================================
const theme = ref('light');
const themeAnimating = ref(false);

function applyTheme(t, persist = true) {
  theme.value = t;
  document.documentElement.setAttribute('data-theme', t);
  if (persist) localStorage.setItem('theme', t);
}

function toggleTheme() {
  const next = theme.value === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  // Dispara animación en ambos sentidos
  themeAnimating.value = true;
  setTimeout(() => { themeAnimating.value = false; }, 400);
}

// Sincroniza el tema en vivo entre pestañas del mismo navegador: al cambiar el
// tema en una pestaña, localStorage dispara el evento 'storage' en las DEMÁS
// pestañas abiertas del mismo origen (esta misma pestaña no lo recibe, por eso
// toggleTheme() actualiza su propio <html> directamente). persist=false evita
// reescribir localStorage en un bucle innecesario.
function sincronizarTema(event) {
  if (event.key !== 'theme' || !event.newValue) return;
  if (event.newValue === 'dark' || event.newValue === 'light') {
    applyTheme(event.newValue, false);
  }
}

const activityEvents = [
  'click',
  'mousedown',
  'pointerdown',
  'keydown',
  'keyup',
  'input',
  'change',
  'paste',
  'scroll',
  'wheel',
  'touchstart',
  'touchend',
  'focus',
  'mousemove',
  'pointermove'
];

onMounted(() => {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
  } else {
    applyTheme('light');
  }
  window.addEventListener('storage', sincronizarSesion);
  window.addEventListener('storage', sincronizarTema);
  document.addEventListener('click', cerrarUserMenuAlClickAfuera);

  // Escuchar toda actividad con capture: true para que @click.stop no la anule
  activityEvents.forEach(evt => {
    window.addEventListener(evt, registrarActividad, { capture: true, passive: true });
  });
  window.addEventListener('app:user-activity', registrarActividad);

  if (autenticado.value) {
    iniciarControlInactividad();
  }
});

onUnmounted(() => {
  document.removeEventListener('click', cerrarUserMenuAlClickAfuera);
  detenerControlInactividad();
  activityEvents.forEach(evt => {
    window.removeEventListener(evt, registrarActividad, { capture: true });
  });
  window.removeEventListener('app:user-activity', registrarActividad);
  window.removeEventListener('storage', sincronizarSesion);
  window.removeEventListener('storage', sincronizarTema);
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
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.navbar-premium__link:hover {
  color: var(--color-white);
  background: rgba(255, 255, 255, 0.08);
}

.navbar-premium__link.router-link-exact-active,
.navbar-premium__link--active {
  color: var(--orange-400) !important;
  background: rgba(249, 115, 22, 0.15) !important;
  font-weight: 600 !important;
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
  color: var(--color-black);
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
  color: var(--color-black);
}

.theme-fab:active {
  transform: scale(0.95);
}

[data-theme="dark"] .theme-fab {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.3);
}

.theme-fab__icon {
  font-size: 1.95rem;
  line-height: 1;
  transition: transform var(--transition-normal);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Ajuste fino: los glifos de emoji no quedan ópticamente centrados
   en su caja por defecto (el sol tiende a verse bajo, la luna alta). */
.theme-fab__icon--sun {
  transform: translateY(1px);
}

.theme-fab__icon--moon {
  transform: translateY(-1px);
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

/* User Profile Dropdown */
.navbar-premium__user-dropdown-container {
  position: relative;
  display: inline-block;
}
.navbar-premium__user-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-lg, 999px);
  padding: 6px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
.navbar-premium__user-btn:hover {
  border-color: var(--orange-500, #f97316);
  background: rgba(249, 115, 22, 0.18);
  color: #ffffff;
}
.navbar-premium__user-avatar {
  background: var(--orange-500, #f97316);
  color: #ffffff;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 700;
}
.navbar-premium__dropdown-arrow {
  font-size: 0.65rem;
  opacity: 0.7;
}
.navbar-premium__user-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: var(--card-bg, #1a1d24);
  border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.15));
  border-radius: var(--radius-md, 8px);
  box-shadow: var(--shadow-xl, 0 10px 25px rgba(0,0,0,0.5));
  min-width: 210px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 6px 0;
  animation: dropdownIn 0.18s ease;
}
@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.navbar-premium__dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  color: var(--text-primary);
  font-size: 0.88rem;
  font-weight: 500;
  text-decoration: none;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}
.navbar-premium__dropdown-item:hover {
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.08));
  color: var(--orange-500, #f97316);
}
.navbar-premium__dropdown-item--logout {
  color: #ef4444;
  border-top: 1px solid var(--border-primary, rgba(255, 255, 255, 0.08));
  margin-top: 4px;
}
.navbar-premium__dropdown-item--logout:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
}
</style>

