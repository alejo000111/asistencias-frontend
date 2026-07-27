<template>
  <div class="cobros-view">
    <!-- ====== HEADER ====== -->
    <div class="cobros-header">
      <div>
        <h1 class="cobros-header__title">💰 Ajustes de Cobro</h1>
        <p class="cobros-header__subtitle">
          Configura cómo cobra tu escuela a sus deportistas. Estos ajustes afectan el portal de padres.
        </p>
      </div>
      <div v-if="guardado" class="cobros-success-banner">
        ✅ Configuración guardada exitosamente
      </div>
    </div>

    <!-- ====== LOADING ====== -->
    <div v-if="cargando" class="cobros-loading">
      <div class="spinner-premium"></div>
      <span>Cargando configuración...</span>
    </div>

    <template v-else>
      <!-- ====== SECCIÓN 1: ESQUEMA DE COBRO ====== -->
      <section class="cobros-section">
        <div class="cobros-section__header">
          <span class="cobros-section__icon">📋</span>
          <div>
            <h2 class="cobros-section__title">Esquema Principal de Cobro</h2>
            <p class="cobros-section__desc">Define cómo se genera la deuda de cada deportista.</p>
          </div>
        </div>

        <div class="cobros-esquema-grid">
          <!-- Opción A: Mensualidad -->
          <label
            class="cobros-esquema-card"
            :class="{ 'cobros-esquema-card--selected': config.esquemaCobro === 'MENSUALIDAD' }"
          >
            <input id="esquema-mensualidad" type="radio" v-model="config.esquemaCobro" value="MENSUALIDAD" class="cobros-esquema-card__radio" />
            <div class="cobros-esquema-card__icon">📅</div>
            <div class="cobros-esquema-card__body">
              <strong>Mensualidad</strong>
              <span>Rangos de días con tarifas preferencial, estándar y mora.</span>
            </div>
            <div v-if="config.esquemaCobro === 'MENSUALIDAD'" class="cobros-esquema-card__check">✓</div>
          </label>

          <!-- Opción B: Paquetes -->
          <label
            class="cobros-esquema-card"
            :class="{ 'cobros-esquema-card--selected': config.esquemaCobro === 'PAQUETE' }"
          >
            <input id="esquema-paquete" type="radio" v-model="config.esquemaCobro" value="PAQUETE" class="cobros-esquema-card__radio" />
            <div class="cobros-esquema-card__icon">📦</div>
            <div class="cobros-esquema-card__body">
              <strong>Paquetes de Clases</strong>
              <span>Venta de paquetes de 5, 10 o 20 clases con descuento.</span>
            </div>
            <div v-if="config.esquemaCobro === 'PAQUETE'" class="cobros-esquema-card__check">✓</div>
          </label>

          <!-- Opción C: Por Clase -->
          <label
            class="cobros-esquema-card"
            :class="{ 'cobros-esquema-card--selected': config.esquemaCobro === 'POR_CLASE' }"
          >
            <input id="esquema-por-clase" type="radio" v-model="config.esquemaCobro" value="POR_CLASE" class="cobros-esquema-card__radio" />
            <div class="cobros-esquema-card__icon">⚡</div>
            <div class="cobros-esquema-card__body">
              <strong>Pago por Clase Asistida</strong>
              <span>Se cobra al registrar cada asistencia. Sin mensualidades.</span>
            </div>
            <div v-if="config.esquemaCobro === 'POR_CLASE'" class="cobros-esquema-card__check">✓</div>
          </label>
        </div>
      </section>

      <!-- ====== SECCIÓN 2: MATRÍCULA ANUAL ====== -->
      <section class="cobros-section">
        <div class="cobros-section__header">
          <span class="cobros-section__icon">🎓</span>
          <div>
            <h2 class="cobros-section__title">Matrícula Anual</h2>
            <p class="cobros-section__desc">Si está desactivada, no aparecerá en el portal de padres.</p>
          </div>
          <!-- Toggle switch -->
          <label class="cobros-toggle" :class="{ 'cobros-toggle--on': config.cobraMatricula }">
            <input id="toggle-matricula" type="checkbox" v-model="config.cobraMatricula" class="cobros-toggle__input" />
            <span class="cobros-toggle__thumb"></span>
            <span class="cobros-toggle__label">{{ config.cobraMatricula ? 'Activada' : 'Desactivada' }}</span>
          </label>
        </div>

        <div v-if="config.cobraMatricula" class="cobros-sub-config">
          <div class="cobros-field-row">
            <div class="cobros-field">
              <label for="matricula-obligatoria" class="cobros-field__label">Tipo</label>
              <select id="matricula-obligatoria" v-model="config.matriculaObligatoria" class="cobros-select">
                <option :value="true">Obligatoria</option>
                <option :value="false">Opcional</option>
              </select>
            </div>
            <div class="cobros-field">
              <label for="matricula-monto" class="cobros-field__label">Monto (COP)</label>
              <input
                id="matricula-monto"
                v-model.number="config.montoMatricula"
                type="number"
                min="0"
                step="1000"
                class="cobros-input"
                placeholder="ej: 120000"
              />
            </div>
          </div>
          <div class="cobros-preview">
            💡 Monto actual:
            <strong>{{ formatCOP(config.montoMatricula) }}</strong>
            — {{ config.matriculaObligatoria ? 'Obligatoria' : 'Opcional' }}
          </div>
        </div>
      </section>

      <!-- ====== SECCIÓN 3: SEGURO DEPORTIVO ====== -->
      <section class="cobros-section">
        <div class="cobros-section__header">
          <span class="cobros-section__icon">🛡️</span>
          <div>
            <h2 class="cobros-section__title">Seguro Deportivo</h2>
            <p class="cobros-section__desc">Si está desactivado, no aparecerá en el portal de padres.</p>
          </div>
          <label class="cobros-toggle" :class="{ 'cobros-toggle--on': config.cobraSeguro }">
            <input id="toggle-seguro" type="checkbox" v-model="config.cobraSeguro" class="cobros-toggle__input" />
            <span class="cobros-toggle__thumb"></span>
            <span class="cobros-toggle__label">{{ config.cobraSeguro ? 'Activado' : 'Desactivado' }}</span>
          </label>
        </div>

        <div v-if="config.cobraSeguro" class="cobros-sub-config">
          <div class="cobros-field-row">
            <div class="cobros-field">
              <label for="seguro-obligatorio" class="cobros-field__label">Tipo</label>
              <select id="seguro-obligatorio" v-model="config.seguroObligatorio" class="cobros-select">
                <option :value="true">Obligatorio</option>
                <option :value="false">Opcional</option>
              </select>
            </div>
            <div class="cobros-field">
              <label for="seguro-monto" class="cobros-field__label">Monto (COP)</label>
              <input
                id="seguro-monto"
                v-model.number="config.montoSeguro"
                type="number"
                min="0"
                step="1000"
                class="cobros-input"
                placeholder="ej: 50000"
              />
            </div>
          </div>
          <div class="cobros-preview">
            💡 Monto actual:
            <strong>{{ formatCOP(config.montoSeguro) }}</strong>
            — {{ config.seguroObligatorio ? 'Obligatorio' : 'Opcional' }}
          </div>
        </div>
      </section>

      <!-- ====== SECCIÓN 4: PRECIOS POR SEDE ====== -->
      <section class="cobros-section">
        <div class="cobros-section__header">
          <span class="cobros-section__icon">🏢</span>
          <div>
            <h2 class="cobros-section__title">Precios por Sede</h2>
            <p class="cobros-section__desc">
              Define si todas las sedes comparten la misma tarifa o si alguna sede tiene precios diferenciados.
            </p>
          </div>
          <label class="cobros-toggle" :class="{ 'cobros-toggle--on': config.preciosDiferenciados }">
            <input id="toggle-precios-diff" type="checkbox" v-model="config.preciosDiferenciados" class="cobros-toggle__input" />
            <span class="cobros-toggle__thumb"></span>
            <span class="cobros-toggle__label">{{ config.preciosDiferenciados ? 'Diferenciados' : 'Unificados' }}</span>
          </label>
        </div>
        <div class="cobros-info-box">
          <span v-if="!config.preciosDiferenciados">
            🔗 Todas las sedes comparten las mismas tarifas de clase (configuradas en ajustes de precios).
          </span>
          <span v-else>
            ⚙️ Cada sede puede tener precios distintos. Configura los precios por sede en la sección de gestión de sedes.
          </span>
        </div>
      </section>

      <!-- ====== RESUMEN PORTAL DE PADRES ====== -->
      <section class="cobros-section cobros-section--preview">
        <div class="cobros-section__header">
          <span class="cobros-section__icon">👁️</span>
          <div>
            <h2 class="cobros-section__title">Vista previa: Portal de Padres</h2>
            <p class="cobros-section__desc">Así verán los conceptos de cobro los acudientes en su portal.</p>
          </div>
        </div>
        <div class="cobros-portal-preview">
          <div class="cobros-portal-item cobros-portal-item--always">
            <span class="cobros-portal-item__icon">📝</span>
            <div>
              <strong>Clases asistidas</strong>
              <span>Siempre visible</span>
            </div>
            <span class="cobros-portal-badge cobros-portal-badge--active">✅ Activo</span>
          </div>
          <div class="cobros-portal-item" :class="{ 'cobros-portal-item--inactive': !config.cobraMatricula }">
            <span class="cobros-portal-item__icon">🎓</span>
            <div>
              <strong>Matrícula anual</strong>
              <span>{{ config.cobraMatricula ? formatCOP(config.montoMatricula) : 'No aplica' }}</span>
            </div>
            <span class="cobros-portal-badge" :class="config.cobraMatricula ? 'cobros-portal-badge--active' : 'cobros-portal-badge--inactive'">
              {{ config.cobraMatricula ? '✅ Visible' : '🚫 Oculto' }}
            </span>
          </div>
          <div class="cobros-portal-item" :class="{ 'cobros-portal-item--inactive': !config.cobraSeguro }">
            <span class="cobros-portal-item__icon">🛡️</span>
            <div>
              <strong>Seguro deportivo</strong>
              <span>{{ config.cobraSeguro ? formatCOP(config.montoSeguro) : 'No aplica' }}</span>
            </div>
            <span class="cobros-portal-badge" :class="config.cobraSeguro ? 'cobros-portal-badge--active' : 'cobros-portal-badge--inactive'">
              {{ config.cobraSeguro ? '✅ Visible' : '🚫 Oculto' }}
            </span>
          </div>
        </div>
      </section>

      <!-- ====== BOTÓN GUARDAR ====== -->
      <div class="cobros-footer">
        <div v-if="error" class="cobros-alert cobros-alert--danger">{{ error }}</div>
        <button
          id="cobros-btn-guardar"
          class="cobros-btn-guardar"
          :disabled="guardando"
          @click="guardarConfig"
        >
          <span v-if="guardando" class="spinner-small"></span>
          {{ guardando ? 'Guardando...' : '💾 Guardar Configuración' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// ─── Estado ───
const cargando = ref(false)
const guardando = ref(false)
const guardado = ref(false)
const error = ref('')

const config = ref({
  esquemaCobro: 'MENSUALIDAD',
  cobraMatricula: false,
  matriculaObligatoria: false,
  montoMatricula: null,
  cobraSeguro: false,
  seguroObligatorio: false,
  montoSeguro: null,
  preciosDiferenciados: false
})

// ─── Ciclo de vida ───
onMounted(cargarConfig)

// ─── API Calls ───
async function cargarConfig() {
  cargando.value = true
  try {
    const res = await axios.get('/api/config/cobro')
    // Mapear respuesta de la entidad al objeto local
    const d = res.data
    config.value = {
      esquemaCobro: d.esquemaCobro || 'MENSUALIDAD',
      cobraMatricula: d.cobraMatricula ?? false,
      matriculaObligatoria: d.matriculaObligatoria ?? false,
      montoMatricula: d.montoMatricula ?? null,
      cobraSeguro: d.cobraSeguro ?? false,
      seguroObligatorio: d.seguroObligatorio ?? false,
      montoSeguro: d.montoSeguro ?? null,
      preciosDiferenciados: d.preciosDiferenciados ?? false
    }
  } catch (e) {
    error.value = 'Error al cargar la configuración de cobro.'
    console.error(e)
  } finally {
    cargando.value = false
  }
}

async function guardarConfig() {
  error.value = ''
  guardando.value = true
  guardado.value = false
  try {
    await axios.put('/api/config/cobro', config.value)
    guardado.value = true
    setTimeout(() => { guardado.value = false }, 3000)
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al guardar la configuración.'
  } finally {
    guardando.value = false
  }
}

// ─── Formatters ───
function formatCOP(val) {
  if (val == null || val === '' || isNaN(Number(val))) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0
  }).format(val)
}
</script>

<style scoped>
/* ─── Layout ─── */
.cobros-view {
  padding: var(--space-6) 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 860px;
  margin: 0 auto;
}

/* ─── Header ─── */
.cobros-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.cobros-header__title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--space-1);
}
.cobros-header__subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}
.cobros-success-banner {
  background: rgba(22, 163, 74, 0.12);
  border: 1px solid rgba(22, 163, 74, 0.3);
  color: #16a34a;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  animation: fadeInDown 0.3s ease;
}
@keyframes fadeInDown {
  from { transform: translateY(-8px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* ─── Loading ─── */
.cobros-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-12) 0;
  color: var(--text-secondary);
}

/* ─── Sección ─── */
.cobros-section {
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  box-shadow: var(--shadow-sm);
}
.cobros-section--preview {
  border-color: rgba(249, 115, 22, 0.2);
}
.cobros-section__header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.cobros-section__icon { font-size: 1.5rem; flex-shrink: 0; margin-top: 2px; }
.cobros-section__title { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0 0 3px; }
.cobros-section__desc  { font-size: 0.84rem; color: var(--text-secondary); margin: 0; }
.cobros-section__header > .cobros-toggle { margin-left: auto; flex-shrink: 0; }

/* ─── Esquema de cobro ─── */
.cobros-esquema-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-3);
}
.cobros-esquema-card {
  position: relative;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: all var(--transition-normal);
  user-select: none;
}
.cobros-esquema-card:hover {
  border-color: var(--orange-500);
  box-shadow: var(--shadow-md);
}
.cobros-esquema-card--selected {
  border-color: var(--orange-500);
  background: rgba(249, 115, 22, 0.06);
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12);
}
.cobros-esquema-card__radio { position: absolute; opacity: 0; width: 0; height: 0; }
.cobros-esquema-card__icon  { font-size: 1.8rem; }
.cobros-esquema-card__body  { display: flex; flex-direction: column; gap: 3px; }
.cobros-esquema-card__body strong { font-size: 0.95rem; color: var(--text-primary); }
.cobros-esquema-card__body span   { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.3; }
.cobros-esquema-card__check {
  position: absolute;
  top: 12px; right: 12px;
  width: 22px; height: 22px;
  background: var(--orange-500);
  color: #fff;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

/* ─── Toggle Switch ─── */
.cobros-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;
}
.cobros-toggle__input { position: absolute; opacity: 0; width: 0; height: 0; }
.cobros-toggle__thumb {
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-primary);
  position: relative;
  transition: all var(--transition-normal);
  flex-shrink: 0;
}
.cobros-toggle__thumb::after {
  content: '';
  position: absolute;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: var(--text-tertiary);
  top: 2px; left: 2px;
  transition: all var(--transition-normal);
}
.cobros-toggle--on .cobros-toggle__thumb {
  background: rgba(249, 115, 22, 0.2);
  border-color: var(--orange-500);
}
.cobros-toggle--on .cobros-toggle__thumb::after {
  background: var(--orange-500);
  transform: translateX(20px);
}
.cobros-toggle__label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); min-width: 90px; }
.cobros-toggle--on .cobros-toggle__label { color: var(--orange-500); }

/* ─── Sub-configuración ─── */
.cobros-sub-config {
  margin-top: var(--space-2);
  padding: var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-secondary);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.cobros-field-row { display: flex; gap: var(--space-4); flex-wrap: wrap; }
.cobros-field { display: flex; flex-direction: column; gap: var(--space-1); flex: 1; min-width: 160px; }
.cobros-field__label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }
.cobros-input, .cobros-select {
  background: var(--input-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  padding: 9px 13px;
  font-size: 0.9rem;
  transition: border-color var(--transition-fast);
  width: 100%;
}
.cobros-input:focus, .cobros-select:focus { outline: none; border-color: var(--orange-500); }
.cobros-preview {
  font-size: 0.82rem;
  color: var(--text-secondary);
  padding: 8px 12px;
  background: rgba(249, 115, 22, 0.06);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--orange-500);
}
.cobros-preview strong { color: var(--orange-500); }

/* ─── Info Box ─── */
.cobros-info-box {
  font-size: 0.87rem;
  color: var(--text-secondary);
  padding: 12px 14px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-secondary);
}

/* ─── Vista previa portal ─── */
.cobros-portal-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.cobros-portal-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-secondary);
  transition: opacity var(--transition-fast);
}
.cobros-portal-item--inactive { opacity: 0.45; }
.cobros-portal-item--always { border-color: rgba(22, 163, 74, 0.25); }
.cobros-portal-item__icon { font-size: 1.3rem; flex-shrink: 0; }
.cobros-portal-item > div { flex: 1; }
.cobros-portal-item strong { font-size: 0.9rem; color: var(--text-primary); display: block; }
.cobros-portal-item span   { font-size: 0.8rem; color: var(--text-secondary); }
.cobros-portal-badge {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.cobros-portal-badge--active   { background: rgba(22, 163, 74, 0.12); color: #16a34a; }
.cobros-portal-badge--inactive { background: rgba(220, 38, 38, 0.1); color: #dc2626; }

/* ─── Footer / Guardar ─── */
.cobros-footer {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-3);
}
.cobros-alert--danger {
  width: 100%;
  padding: 10px 14px;
  background: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.3);
  color: #dc2626;
  border-radius: var(--radius-md);
  font-size: 0.87rem;
}
.cobros-btn-guardar {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 12px 28px;
  background: var(--orange-500);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-md);
}
.cobros-btn-guardar:hover:not(:disabled) {
  background: var(--orange-600, #ea580c);
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}
.cobros-btn-guardar:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner-small {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Responsive ─── */
@media (max-width: 600px) {
  .cobros-section { padding: var(--space-4); }
  .cobros-esquema-grid { grid-template-columns: 1fr; }
  .cobros-btn-guardar { width: 100%; justify-content: center; }
  .cobros-footer { align-items: stretch; }
}
</style>
