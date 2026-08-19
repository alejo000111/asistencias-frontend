<template>
  <div class="config-view">
    <!-- Header -->
    <div class="config-header">
      <div>
        <h1 class="config-title">⚙️ Configuración de Cuenta</h1>
        <p class="config-subtitle">Gestiona la seguridad de tu cuenta, preferencias del club y configuración de tarifas.</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="config-tabs">
      <button
        class="config-tab-btn"
        :class="{ 'config-tab-btn--active': activeTab === 'seguridad' }"
        @click="activeTab = 'seguridad'"
      >
        🔒 Seguridad y Contraseña
      </button>
      <button
        v-if="esAdmin || esSuperAdmin"
        class="config-tab-btn"
        :class="{ 'config-tab-btn--active': activeTab === 'general' }"
        @click="activeTab = 'general'"
      >
        ⚙️ Configuración General
      </button>
    </div>

    <!-- TAB 1: SEGURIDAD -->
    <div v-if="activeTab === 'seguridad'" class="config-section">
      <div class="config-card">
        <h2 class="config-card__title">🔒 Cambio de Contraseña</h2>
        <p class="config-card__desc">Actualiza tu clave de acceso para mantener tu cuenta protegida.</p>

        <form @submit.prevent="guardarPassword" class="config-form">
          <div v-if="errorPass" class="config-alert config-alert--danger">{{ errorPass }}</div>
          <div v-if="exitoPass" class="config-alert config-alert--success">✅ Contraseña actualizada correctamente.</div>

          <div class="config-field">
            <label for="current-pass">Contraseña Actual *</label>
            <input
              id="current-pass"
              v-model="formPass.currentPassword"
              type="password"
              class="config-input"
              placeholder="Ingresa tu contraseña actual"
              required
            />
          </div>

          <div class="config-field">
            <label for="new-pass">Nueva Contraseña *</label>
            <input
              id="new-pass"
              v-model="formPass.newPassword"
              type="password"
              class="config-input"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div class="config-field">
            <label for="confirm-pass">Confirmar Nueva Contraseña *</label>
            <input
              id="confirm-pass"
              v-model="formPass.confirmPassword"
              type="password"
              class="config-input"
              placeholder="Repite la nueva contraseña"
              required
            />
          </div>

          <button type="submit" class="btn-config-primary" :disabled="guardandoPass">
            {{ guardandoPass ? 'Guardando...' : '💾 Actualizar Contraseña' }}
          </button>
        </form>
      </div>
    </div>

    <!-- TAB 2: GENERAL (solo ADMIN/SUPERADMIN) -->
    <div v-if="activeTab === 'general' && (esAdmin || esSuperAdmin)" class="config-section">
      <div v-if="esSuperAdmin" class="config-card">
        <h2 class="config-card__title">⚡ Perfil SuperAdmin Activo</h2>
        <p class="config-card__desc">
          Tu usuario cuenta con permisos globales de administración de la plataforma. La gestión de escuelas y licenciamiento se administra desde el panel comercial.
        </p>
        <router-link to="/superadmin" class="btn-config-primary" style="display: inline-block; width: auto;">
          ⚡ Ir al Panel SuperAdmin →
        </router-link>
      </div>

      <div v-else>
        <div class="config-cards-grid">
          <div class="config-card">
            <div class="config-card__header-icon">💰</div>
            <h2 class="config-card__title">Ajustes de Cobros</h2>
            <p class="config-card__desc">Configura precios, matrícula anual, seguro deportivo, escenarios y complementos.</p>
            <router-link to="/ajustes-cobros" class="btn-config-secondary">Ir a Ajustes de Cobros →</router-link>
          </div>

          <div class="config-card">
            <div class="config-card__header-icon">🏢</div>
            <h2 class="config-card__title">Gestión de Sedes</h2>
            <p class="config-card__desc">Administra tus sedes deportivas, grupos y horarios asignados.</p>
            <router-link to="/gestion-sedes" class="btn-config-secondary">Ir a Gestión de Sedes →</router-link>
          </div>

          <div class="config-card">
            <div class="config-card__header-icon">👤</div>
            <h2 class="config-card__title">Gestión de Empleados</h2>
            <p class="config-card__desc">Gestiona accesos y permisos para entrenadores y colaboradores.</p>
            <router-link to="/gestion-empleados" class="btn-config-secondary">Ir a Gestión de Empleados →</router-link>
          </div>

          <div class="config-card">
            <div class="config-card__header-icon">💳</div>
            <h2 class="config-card__title">Esquema de Cobro</h2>
            <p class="config-card__desc">Establece el modelo de facturación para tu club (mensualidad, paquetes o pago por clase). Las tarifas, matrículas y precios específicos se gestionan en Ajustes de Cobros.</p>
            <router-link to="/esquema-cobro" class="btn-config-secondary">Ir a Esquema de Cobro →</router-link>
          </div>
        </div>

        <div class="mt-4">
          <WompiConfig />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { isAdmin, isSuperAdmin } from '@/utils/auth'
import WompiConfig from '@/components/WompiConfig.vue'

const esAdmin = isAdmin()
const esSuperAdmin = isSuperAdmin()
const activeTab = ref('seguridad')

// Contraseña
const formPass = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const guardandoPass = ref(false)
const errorPass = ref('')
const exitoPass = ref(false)

async function guardarPassword() {
  errorPass.value = ''
  exitoPass.value = false

  if (formPass.value.newPassword !== formPass.value.confirmPassword) {
    errorPass.value = 'Las nuevas contraseñas no coinciden.'
    return
  }

  guardandoPass.value = true
  try {
    await axios.post('/api/account/change-password', {
      currentPassword: formPass.value.currentPassword,
      newPassword: formPass.value.newPassword
    })
    exitoPass.value = true
    formPass.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (e) {
    errorPass.value = e.response?.data?.error || 'Error al cambiar la contraseña.'
  } finally {
    guardandoPass.value = false
  }
}

// Tarifas
const tarifas = ref({ tarifaClase: 25000, costoEntrenador: 1200000 })
const guardandoTarifas = ref(false)

function guardarTarifas() {
  guardandoTarifas.value = true
  setTimeout(() => {
    guardandoTarifas.value = false
    alert('Tarifas actualizadas correctamente.')
  }, 600)
}
</script>

<style scoped>
.config-view {
  padding: var(--space-6) 0;
  max-width: 880px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
.config-header { margin-bottom: var(--space-2); }
.config-title { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
.config-subtitle { font-size: 0.9rem; color: var(--text-secondary); margin: 0; }

.config-tabs {
  display: flex;
  gap: var(--space-2);
  border-bottom: 1px solid var(--border-primary);
  padding-bottom: var(--space-1);
  flex-wrap: wrap;
}
.config-tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 10px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.config-tab-btn:hover { color: var(--text-primary); }
.config-tab-btn--active {
  color: var(--orange-500);
  border-bottom-color: var(--orange-500);
}

.config-section { animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

.config-card {
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}
.config-card__title { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin: 0 0 4px; }
.config-card__desc { font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 var(--space-4); }
.config-card__header-icon { font-size: 2rem; margin-bottom: var(--space-2); }

.config-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
}

.config-form { display: flex; flex-direction: column; gap: var(--space-4); max-width: 440px; }
.config-field { display: flex; flex-direction: column; gap: 4px; }
.config-field label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
.config-input {
  background: var(--input-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  padding: 10px 14px;
  font-size: 0.9rem;
}
.config-input:focus { outline: none; border-color: var(--orange-500); }

.btn-config-primary {
  padding: 10px 22px;
  background: var(--orange-500);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.btn-config-primary:hover { background: var(--orange-600); }

.btn-config-secondary {
  display: inline-block;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  margin-top: var(--space-2);
}
.btn-config-secondary:hover { border-color: var(--orange-500); color: var(--orange-500); }

.config-alert { padding: 10px 14px; border-radius: var(--radius-md); font-size: 0.85rem; font-weight: 500; }
.config-alert--danger { background: rgba(220, 38, 38, 0.1); color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.3); }
.config-alert--success { background: rgba(22, 163, 74, 0.12); color: #16a34a; border: 1px solid rgba(22, 163, 74, 0.3); }

.config-rates-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4); }
.rate-box { background: var(--bg-secondary); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--border-secondary); display: flex; flex-direction: column; gap: 6px; }
.rate-box__label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
.rate-box__sub { font-size: 0.78rem; color: var(--text-tertiary, #888); }

/* Tarjetas de esquema de cobro (movidas desde AjustesCobrosView.vue) */
.cobros-esquema-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-3); }
.cobros-esquema-card { background: var(--bg-secondary); border: 2px solid var(--border-primary); border-radius: var(--radius-md); padding: var(--space-4); cursor: pointer; display: flex; align-items: flex-start; gap: var(--space-3); position: relative; transition: all 0.2s ease; }
.cobros-esquema-card--selected { border-color: var(--orange-500); background: rgba(249, 115, 22, 0.05); }
.cobros-esquema-card__radio { position: absolute; opacity: 0; }
.cobros-esquema-card__icon { font-size: 1.4rem; }
.cobros-esquema-card__body strong { display: block; font-size: 0.95rem; color: var(--text-primary); margin-bottom: 2px; }
.cobros-esquema-card__body span { font-size: 0.78rem; color: var(--text-secondary); line-height: 1.3; }
.cobros-esquema-card__check { margin-left: auto; color: var(--orange-500); font-weight: bold; }
</style>
