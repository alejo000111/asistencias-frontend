<template>
  <div class="superadmin-view">
    <!-- ====== HEADER ====== -->
    <div class="superadmin-header">
      <div class="superadmin-header__left">
        <span class="superadmin-header__badge">⚡ SUPERADMIN</span>
        <h1 class="superadmin-header__title">Panel de Gestión de la Plataforma</h1>
        <p class="superadmin-header__subtitle">
          Administra los clubs, licencias y tramos de precio del SaaS.
          <strong>No tienes acceso a datos de deportistas ni transacciones de ningún club.</strong>
        </p>
      </div>
      <button class="btn-premium btn-premium--primary" @click="abrirModalNuevoClub">
        ➕ Nuevo Club
      </button>
    </div>

    <!-- ====== STATS ====== -->
    <div class="superadmin-stats">
      <div class="stat-card">
        <span class="stat-card__icon">🏢</span>
        <div class="stat-card__body">
          <span class="stat-card__value">{{ clubes.length }}</span>
          <span class="stat-card__label">Clubs Registrados</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-card__icon">✅</span>
        <div class="stat-card__body">
          <span class="stat-card__value">{{ clubesActivos }}</span>
          <span class="stat-card__label">Clubs Activos</span>
        </div>
      </div>
      <div class="stat-card stat-card--danger">
        <span class="stat-card__icon">⚠️</span>
        <div class="stat-card__body">
          <span class="stat-card__value">{{ clubesSuspendidos }}</span>
          <span class="stat-card__label">Suspendidos por Mora</span>
        </div>
      </div>
    </div>

    <!-- ====== TABLA DE CLUBS ====== -->
    <section class="superadmin-section">
      <div class="superadmin-section__header">
        <h2 class="superadmin-section__title">🏢 Clubs Registrados</h2>
        <input
          id="sa-buscar-club"
          v-model="busqueda"
          type="text"
          class="sa-search"
          placeholder="Buscar por nombre, NIT o usuario..."
        />
      </div>

      <div v-if="cargando" class="sa-loading">
        <div class="spinner-premium"></div>
        <span>Cargando clubs...</span>
      </div>

      <div v-else-if="clubesFiltrados.length === 0" class="sa-empty">
        <span>🔍</span>
        <p>No se encontraron clubs.</p>
      </div>

      <div v-else class="sa-table-wrapper">
        <table class="sa-table">
          <thead>
            <tr>
              <th>Club</th>
              <th>NIT</th>
              <th>Usuario Admin</th>
              <th>Estado</th>
              <th>Plan</th>
              <th>Fecha de Corte</th>
              <th>Sedes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="club in clubesFiltrados" :key="club.id" :class="{ 'sa-table__row--suspended': club.clubEstado === 'SUSPENDIDO_POR_MORA' }">
              <td class="sa-table__nombre">
                {{ club.clubNombre || '—' }}
              </td>
              <td class="sa-table__nit">{{ club.clubNit || '—' }}</td>
              <td>
                <code class="sa-badge sa-badge--user">{{ club.username }}</code>
              </td>
              <td>
                <span
                  class="sa-badge"
                  :class="club.clubEstado === 'SUSPENDIDO_POR_MORA' ? 'sa-badge--danger' : 'sa-badge--success'"
                >
                  {{ club.clubEstado === 'SUSPENDIDO_POR_MORA' ? '🚫 Suspendido' : '✅ Activo' }}
                </span>
              </td>
              <td>
                <span class="sa-badge sa-badge--plan">
                  {{ formatPlan(club.planActual) }}
                </span>
              </td>
              <td>{{ formatFecha(club.fechaCorte) }}</td>
              <td class="sa-table__sedes">{{ club.totalSedes }}</td>
              <td>
                <div class="sa-table__actions">
                  <button
                    v-if="club.clubEstado !== 'SUSPENDIDO_POR_MORA'"
                    class="btn-sm btn-sm--danger"
                    :disabled="loadingClubId === club.id"
                    @click="suspenderClub(club)"
                    title="Suspender por mora"
                  >
                    🚫 Suspender
                  </button>
                  <button
                    v-else
                    class="btn-sm btn-sm--success"
                    :disabled="loadingClubId === club.id"
                    @click="activarClub(club)"
                    title="Reactivar club"
                  >
                    ✅ Activar
                  </button>
                  <button
                    class="btn-sm btn-sm--secondary"
                    @click="editarClub(club)"
                    title="Editar datos del club"
                  >
                    ✏️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ====== TABLA DE PLANES SAAS ====== -->
    <section class="superadmin-section">
      <div class="superadmin-section__header">
        <h2 class="superadmin-section__title">💎 Tramos de Precio SaaS</h2>
        <p class="superadmin-section__desc">
          Configura los límites y precios de cada tramo según la cantidad de deportistas activos del club.
        </p>
      </div>

      <div class="sa-planes-grid">
        <div
          v-for="plan in planes"
          :key="plan.id"
          class="sa-plan-card"
          :class="{ 'sa-plan-card--editing': planEditando === plan.id }"
        >
          <div class="sa-plan-card__header">
            <span class="sa-plan-card__badge">{{ formatTramoBadge(plan) }}</span>
            <span class="sa-plan-card__nombre">{{ plan.nombre }}</span>
          </div>
          <div class="sa-plan-card__range">
            {{ plan.limiteInferior }}–{{ plan.limiteSuperior ?? '∞' }} deportistas
          </div>
          <div v-if="planEditando !== plan.id" class="sa-plan-card__precio">
            {{ formatCOP(plan.precioCopMensual) }}
            <span class="sa-plan-card__per">/mes</span>
          </div>
          <div v-else class="sa-plan-card__edit">
            <input
              :id="`sa-precio-plan-${plan.id}`"
              v-model="precioEditando"
              type="number"
              min="0"
              step="1000"
              class="sa-input"
              placeholder="Nuevo precio COP"
            />
            <div class="sa-plan-card__edit-actions">
              <button class="btn-sm btn-sm--primary" @click="guardarPlan(plan.id)">💾 Guardar</button>
              <button class="btn-sm btn-sm--secondary" @click="cancelarEditarPlan">✕</button>
            </div>
          </div>
          <button
            v-if="planEditando !== plan.id"
            class="btn-sm btn-sm--secondary sa-plan-card__btn-edit"
            @click="iniciarEditarPlan(plan)"
          >
            ✏️ Editar precio
          </button>
        </div>
      </div>
    </section>

    <!-- ====== MODAL: NUEVO CLUB ====== -->
    <div v-if="modalNuevoClub" class="sa-modal-overlay" @click.self="cerrarModalNuevoClub">
      <div class="sa-modal">
        <div class="sa-modal__header">
          <h3>➕ Crear Nuevo Club</h3>
          <button class="sa-modal__close" @click="cerrarModalNuevoClub">✕</button>
        </div>
        <div class="sa-modal__body">
          <div v-if="errorModal" class="sa-alert sa-alert--danger">{{ errorModal }}</div>

          <label for="sa-nuevo-username">Usuario Admin *</label>
          <input id="sa-nuevo-username" v-model="nuevoClub.username" type="text" class="sa-input" placeholder="ej: admin_tigres" />

          <label for="sa-nuevo-password">Contraseña temporal *</label>
          <input id="sa-nuevo-password" v-model="nuevoClub.password" type="password" class="sa-input" placeholder="Mínimo 6 caracteres" />

          <label for="sa-nuevo-nombre">Nombre del Club *</label>
          <input id="sa-nuevo-nombre" v-model="nuevoClub.clubNombre" type="text" class="sa-input" placeholder="ej: Academia Tigres" />

          <label for="sa-nuevo-nit">NIT del Club</label>
          <input id="sa-nuevo-nit" v-model="nuevoClub.clubNit" type="text" class="sa-input" placeholder="ej: 900123456-1" />

          <label for="sa-nuevo-corte">Fecha de Corte</label>
          <input id="sa-nuevo-corte" v-model="nuevoClub.fechaCorte" type="date" class="sa-input" />
        </div>
        <div class="sa-modal__footer">
          <button class="btn-sm btn-sm--secondary" @click="cerrarModalNuevoClub">Cancelar</button>
          <button class="btn-sm btn-sm--primary" :disabled="creandoClub" @click="crearClub">
            {{ creandoClub ? 'Creando...' : '✅ Crear Club' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ====== MODAL: EDITAR CLUB ====== -->
    <div v-if="modalEditarClub" class="sa-modal-overlay" @click.self="cerrarModalEditar">
      <div class="sa-modal">
        <div class="sa-modal__header">
          <h3>✏️ Editar Club — {{ clubEditando?.username }}</h3>
          <button class="sa-modal__close" @click="cerrarModalEditar">✕</button>
        </div>
        <div class="sa-modal__body">
          <div v-if="errorModal" class="sa-alert sa-alert--danger">{{ errorModal }}</div>

          <label for="sa-edit-nombre">Nombre del Club</label>
          <input id="sa-edit-nombre" v-model="formEditar.clubNombre" type="text" class="sa-input" />

          <label for="sa-edit-nit">NIT del Club</label>
          <input id="sa-edit-nit" v-model="formEditar.clubNit" type="text" class="sa-input" />

          <label for="sa-edit-corte">Fecha de Corte</label>
          <input id="sa-edit-corte" v-model="formEditar.fechaCorte" type="date" class="sa-input" />
        </div>
        <div class="sa-modal__footer">
          <button class="btn-sm btn-sm--secondary" @click="cerrarModalEditar">Cancelar</button>
          <button class="btn-sm btn-sm--primary" :disabled="guardandoEdicion" @click="guardarEdicion">
            {{ guardandoEdicion ? 'Guardando...' : '💾 Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

// ─── Estado principal ───
const clubes = ref([])
const planes = ref([])
const cargando = ref(false)
const busqueda = ref('')
const loadingClubId = ref(null)

// ─── Modal Nuevo Club ───
const modalNuevoClub = ref(false)
const creandoClub = ref(false)
const errorModal = ref('')
const nuevoClub = ref({ username: '', password: '', clubNombre: '', clubNit: '', fechaCorte: '' })

// ─── Modal Editar Club ───
const modalEditarClub = ref(false)
const clubEditando = ref(null)
const guardandoEdicion = ref(false)
const formEditar = ref({ clubNombre: '', clubNit: '', fechaCorte: '' })

// ─── Editar Plan ───
const planEditando = ref(null)
const precioEditando = ref('')

// ─── Computed ───
const clubesActivos = computed(() => clubes.value.filter(c => c.clubEstado !== 'SUSPENDIDO_POR_MORA').length)
const clubesSuspendidos = computed(() => clubes.value.filter(c => c.clubEstado === 'SUSPENDIDO_POR_MORA').length)
const clubesFiltrados = computed(() => {
  const q = busqueda.value.toLowerCase().trim()
  if (!q) return clubes.value
  return clubes.value.filter(c =>
    (c.clubNombre || '').toLowerCase().includes(q) ||
    (c.clubNit || '').toLowerCase().includes(q) ||
    (c.username || '').toLowerCase().includes(q)
  )
})

// ─── Ciclo de vida ───
onMounted(async () => {
  await Promise.all([cargarClubes(), cargarPlanes()])
})

// ─── API Calls ───
async function cargarClubes() {
  cargando.value = true
  try {
    const res = await axios.get('/api/superadmin/clubes')
    clubes.value = res.data
  } catch (e) {
    console.error('Error al cargar clubes:', e)
  } finally {
    cargando.value = false
  }
}

async function cargarPlanes() {
  try {
    const res = await axios.get('/api/superadmin/planes')
    planes.value = res.data
  } catch (e) {
    console.error('Error al cargar planes:', e)
  }
}

async function suspenderClub(club) {
  if (!confirm(`¿Suspender el club "${club.clubNombre || club.username}" por mora?\n\nSus usuarios solo podrán registrar asistencias hasta que se regularice el pago.`)) return
  loadingClubId.value = club.id
  try {
    await axios.put(`/api/superadmin/clubes/${club.id}/suspender`)
    await cargarClubes()
  } catch (e) {
    alert('Error al suspender el club: ' + (e.response?.data?.error || e.message))
  } finally {
    loadingClubId.value = null
  }
}

async function activarClub(club) {
  if (!confirm(`¿Reactivar el club "${club.clubNombre || club.username}"?`)) return
  loadingClubId.value = club.id
  try {
    await axios.put(`/api/superadmin/clubes/${club.id}/activar`)
    await cargarClubes()
  } catch (e) {
    alert('Error al activar el club: ' + (e.response?.data?.error || e.message))
  } finally {
    loadingClubId.value = null
  }
}

// ─── Modal Nuevo Club ───
function abrirModalNuevoClub() {
  nuevoClub.value = { username: '', password: '', clubNombre: '', clubNit: '', fechaCorte: '' }
  errorModal.value = ''
  modalNuevoClub.value = true
}
function cerrarModalNuevoClub() { modalNuevoClub.value = false }

async function crearClub() {
  errorModal.value = ''
  if (!nuevoClub.value.username || !nuevoClub.value.password || !nuevoClub.value.clubNombre) {
    errorModal.value = 'Usuario, contraseña y nombre del club son obligatorios.'
    return
  }
  creandoClub.value = true
  try {
    await axios.post('/api/superadmin/clubes', nuevoClub.value)
    cerrarModalNuevoClub()
    await cargarClubes()
  } catch (e) {
    errorModal.value = e.response?.data?.error || 'Error al crear el club.'
  } finally {
    creandoClub.value = false
  }
}

// ─── Modal Editar Club ───
function editarClub(club) {
  clubEditando.value = club
  formEditar.value = {
    clubNombre: club.clubNombre || '',
    clubNit: club.clubNit || '',
    fechaCorte: club.fechaCorte || ''
  }
  errorModal.value = ''
  modalEditarClub.value = true
}
function cerrarModalEditar() { modalEditarClub.value = false }

async function guardarEdicion() {
  errorModal.value = ''
  guardandoEdicion.value = true
  try {
    await axios.put(`/api/superadmin/clubes/${clubEditando.value.id}`, formEditar.value)
    cerrarModalEditar()
    await cargarClubes()
  } catch (e) {
    errorModal.value = e.response?.data?.error || 'Error al guardar los cambios.'
  } finally {
    guardandoEdicion.value = false
  }
}

// ─── Editar Plan ───
function iniciarEditarPlan(plan) {
  planEditando.value = plan.id
  precioEditando.value = plan.precioCopMensual
}
function cancelarEditarPlan() { planEditando.value = null; precioEditando.value = '' }

async function guardarPlan(planId) {
  try {
    await axios.put(`/api/superadmin/planes/${planId}`, { precioCopMensual: Number(precioEditando.value) })
    cancelarEditarPlan()
    await cargarPlanes()
  } catch (e) {
    alert('Error al guardar el plan: ' + (e.response?.data?.error || e.message))
  }
}

// ─── Formatters ───
function formatCOP(val) {
  if (val == null) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)
}
function formatFecha(val) {
  if (!val) return '—'
  return new Date(val + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatPlan(plan) {
  if (!plan) return '—'
  const map = { TRAMO_1: '🥉 Tramo 1', TRAMO_2: '🥈 Tramo 2', TRAMO_3: '🥇 Tramo 3' }
  return map[plan] || plan
}
function formatTramoBadge(plan) {
  if (plan.limiteInferior <= 20) return '🥉'
  if (plan.limiteInferior <= 40) return '🥈'
  return '🥇'
}
</script>

<style scoped>
/* ─── Layout General ─── */
.superadmin-view {
  padding: var(--space-6) 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

/* ─── Header ─── */
.superadmin-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.superadmin-header__badge {
  display: inline-block;
  background: linear-gradient(135deg, #fbbf24, #f97316);
  color: #0a0a0a;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: var(--space-2);
}
.superadmin-header__title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--space-2);
}
.superadmin-header__subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  max-width: 600px;
}

/* ─── Stats ─── */
.superadmin-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}
.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast);
}
.stat-card:hover { box-shadow: var(--shadow-md); }
.stat-card--danger { border-color: rgba(220, 38, 38, 0.3); }
.stat-card__icon { font-size: 2rem; line-height: 1; }
.stat-card__body { display: flex; flex-direction: column; }
.stat-card__value { font-size: 1.8rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
.stat-card__label { font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; }

/* ─── Secciones ─── */
.superadmin-section {
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  box-shadow: var(--shadow-sm);
}
.superadmin-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-5);
}
.superadmin-section__title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.superadmin-section__desc {
  font-size: 0.87rem;
  color: var(--text-secondary);
  margin: var(--space-1) 0 0;
}

/* ─── Search ─── */
.sa-search {
  background: var(--input-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  padding: 8px 14px;
  font-size: 0.9rem;
  min-width: 240px;
  transition: border-color var(--transition-fast);
}
.sa-search:focus { outline: none; border-color: var(--orange-500); }

/* ─── Loading / Empty ─── */
.sa-loading, .sa-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-10) 0;
  color: var(--text-secondary);
}
.sa-empty span { font-size: 2.5rem; }

/* ─── Tabla ─── */
.sa-table-wrapper { overflow-x: auto; }
.sa-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.sa-table th {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 14px;
  text-align: left;
  white-space: nowrap;
}
.sa-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-secondary);
  color: var(--text-primary);
  vertical-align: middle;
}
.sa-table__row--suspended td {
  opacity: 0.7;
  background: rgba(220, 38, 38, 0.04);
}
.sa-table__nombre { font-weight: 600; }
.sa-table__nit { font-family: monospace; font-size: 0.85rem; color: var(--text-secondary); }
.sa-table__actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.sa-table__sedes { text-align: center; font-weight: 600; }

/* ─── Badges ─── */
.sa-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}
.sa-badge--success { background: rgba(22, 163, 74, 0.12); color: #16a34a; border: 1px solid rgba(22, 163, 74, 0.25); }
.sa-badge--danger  { background: rgba(220, 38, 38, 0.12); color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.25); }
.sa-badge--user    { background: var(--bg-tertiary); color: var(--text-secondary); font-family: monospace; border-radius: var(--radius-sm); }
.sa-badge--plan    { background: rgba(251, 191, 36, 0.12); color: #d97706; border: 1px solid rgba(251, 191, 36, 0.25); }

/* ─── Planes SaaS ─── */
.sa-planes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
}
.sa-plan-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}
.sa-plan-card:hover, .sa-plan-card--editing {
  box-shadow: var(--shadow-md);
  border-color: var(--orange-500);
}
.sa-plan-card__header { display: flex; align-items: center; gap: var(--space-2); }
.sa-plan-card__badge  { font-size: 1.5rem; }
.sa-plan-card__nombre { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
.sa-plan-card__range  { font-size: 0.82rem; color: var(--text-secondary); }
.sa-plan-card__precio { font-size: 1.8rem; font-weight: 700; color: var(--orange-500); }
.sa-plan-card__per    { font-size: 0.85rem; font-weight: 400; color: var(--text-secondary); }
.sa-plan-card__btn-edit { margin-top: auto; }
.sa-plan-card__edit { display: flex; flex-direction: column; gap: var(--space-2); }
.sa-plan-card__edit-actions { display: flex; gap: var(--space-2); }

/* ─── Buttons ─── */
.btn-premium {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all var(--transition-fast);
}
.btn-premium--primary {
  background: var(--orange-500);
  color: #fff;
}
.btn-premium--primary:hover { background: var(--orange-600); box-shadow: var(--shadow-md); }

.btn-sm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}
.btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sm--primary   { background: var(--orange-500); color: #fff; }
.btn-sm--primary:hover:not(:disabled) { background: var(--orange-600); }
.btn-sm--success   { background: rgba(22, 163, 74, 0.12); color: #16a34a; border-color: rgba(22, 163, 74, 0.3); }
.btn-sm--success:hover:not(:disabled) { background: rgba(22, 163, 74, 0.2); }
.btn-sm--danger    { background: rgba(220, 38, 38, 0.1); color: #dc2626; border-color: rgba(220, 38, 38, 0.3); }
.btn-sm--danger:hover:not(:disabled) { background: rgba(220, 38, 38, 0.2); }
.btn-sm--secondary { background: var(--bg-tertiary); color: var(--text-secondary); border-color: var(--border-primary); }
.btn-sm--secondary:hover:not(:disabled) { color: var(--text-primary); border-color: var(--orange-500); }

/* ─── Inputs ─── */
.sa-input {
  width: 100%;
  background: var(--input-bg);
  border: 1px solid var(--input-border, var(--border-primary));
  border-radius: var(--radius-md);
  color: var(--text-primary);
  padding: 9px 13px;
  font-size: 0.9rem;
  transition: border-color var(--transition-fast);
}
.sa-input:focus { outline: none; border-color: var(--orange-500); }

/* ─── Modal ─── */
.sa-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}
.sa-modal {
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  animation: sa-modal-in 0.22s ease;
}
@keyframes sa-modal-in {
  from { transform: scale(0.95) translateY(8px); opacity: 0; }
  to   { transform: scale(1) translateY(0);     opacity: 1; }
}
.sa-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border-primary);
}
.sa-modal__header h3 { margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-primary); }
.sa-modal__close { background: none; border: none; cursor: pointer; font-size: 1.1rem; color: var(--text-secondary); padding: 4px; }
.sa-modal__close:hover { color: var(--text-primary); }
.sa-modal__body {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.sa-modal__body label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
.sa-modal__footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border-primary);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

/* ─── Alert ─── */
.sa-alert {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 500;
}
.sa-alert--danger { background: rgba(220, 38, 38, 0.1); color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.3); }

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .superadmin-header { flex-direction: column; }
  .superadmin-section__header { flex-direction: column; align-items: flex-start; }
  .sa-search { min-width: 100%; }
}
</style>
