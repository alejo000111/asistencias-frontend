<template>
  <div class="esquema-view">
    <!-- Header / Breadcrumb -->
    <div class="esquema-nav">
      <router-link to="/configuracion" class="esquema-back-link">
        ← Volver a Configuración
      </router-link>
    </div>

    <div class="esquema-header">
      <div class="esquema-header__icon">💳</div>
      <div>
        <h1 class="esquema-title">Esquema de Cobro</h1>
        <p class="esquema-subtitle">
          Configura el modelo principal de facturación de tu club según tu metodología deportiva. Las tarifas, matrículas, seguros y fechas de corte se administran en <router-link to="/ajustes-cobros" class="esquema-inline-link">Ajustes de Cobros</router-link>.
        </p>
      </div>
    </div>

    <!-- Main Card Container -->
    <div class="esquema-main-card">
      <div v-if="cargandoEsquema" class="esquema-loading">
        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
        <span>Cargando esquema actual...</span>
      </div>

      <template v-else>
        <div class="cobros-esquema-grid">
          <label
            class="cobros-esquema-card"
            :class="{ 'cobros-esquema-card--selected': esquemaCobro === 'MENSUALIDAD' }"
          >
            <input
              type="radio"
              v-model="esquemaCobro"
              value="MENSUALIDAD"
              class="cobros-esquema-card__radio"
            />
            <div class="cobros-esquema-card__icon">📅</div>
            <div class="cobros-esquema-card__body">
              <strong>Mensualidad</strong>
              <span>Cobro periódico por mes con calendario flexible de fechas de corte (tarifas preferencial, estándar y con mora).</span>
            </div>
            <div v-if="esquemaCobro === 'MENSUALIDAD'" class="cobros-esquema-card__check">✓</div>
          </label>

          <label
            class="cobros-esquema-card"
            :class="{ 'cobros-esquema-card--selected': esquemaCobro === 'PAQUETE' }"
          >
            <input
              type="radio"
              v-model="esquemaCobro"
              value="PAQUETE"
              class="cobros-esquema-card__radio"
            />
            <div class="cobros-esquema-card__icon">📦</div>
            <div class="cobros-esquema-card__body">
              <strong>Paquetes de Clases</strong>
              <span>Venta de tiqueteras o paquetes con cantidad fija de sesiones y vigencia personalizada para los deportistas.</span>
            </div>
            <div v-if="esquemaCobro === 'PAQUETE'" class="cobros-esquema-card__check">✓</div>
          </label>

          <label
            class="cobros-esquema-card"
            :class="{ 'cobros-esquema-card--selected': esquemaCobro === 'POR_CLASE' }"
          >
            <input
              type="radio"
              v-model="esquemaCobro"
              value="POR_CLASE"
              class="cobros-esquema-card__radio"
            />
            <div class="cobros-esquema-card__icon">⚡</div>
            <div class="cobros-esquema-card__body">
              <strong>Pago por Clase Asistida</strong>
              <span>Cobro por cada sesión individual realizada, con tarifas diferenciadas para clases grupales y personalizadas.</span>
            </div>
            <div v-if="esquemaCobro === 'POR_CLASE'" class="cobros-esquema-card__check">✓</div>
          </label>
        </div>

        <div v-if="errorEsquema" class="esquema-alert esquema-alert--danger">
          ⚠️ {{ errorEsquema }}
        </div>
        <div v-if="exitoEsquema" class="esquema-alert esquema-alert--success">
          ✅ Esquema de cobro actualizado correctamente.
        </div>

        <div class="esquema-actions">
          <button
            class="btn-esquema-primary"
            :disabled="guardandoEsquema || esquemaCobro === esquemaCobroOriginal"
            @click="guardarEsquemaCobro"
          >
            {{ guardandoEsquema ? 'Guardando...' : '💾 Guardar Esquema' }}
          </button>

          <router-link to="/configuracion" class="btn-esquema-secondary">
            Cancelar
          </router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const cargandoEsquema = ref(false)
const guardandoEsquema = ref(false)
const errorEsquema = ref('')
const exitoEsquema = ref(false)
const esquemaCobro = ref('MENSUALIDAD')
const esquemaCobroOriginal = ref('MENSUALIDAD')

async function cargarEsquemaCobro() {
  cargandoEsquema.value = true
  try {
    const res = await axios.get('/api/config/cobro')
    esquemaCobro.value = res.data?.esquemaCobro || 'MENSUALIDAD'
    esquemaCobroOriginal.value = esquemaCobro.value
  } catch (e) {
    console.error('Error al cargar el esquema de cobro:', e)
    errorEsquema.value = 'No se pudo cargar la configuración de cobro actual.'
  } finally {
    cargandoEsquema.value = false
  }
}

// Explica en lenguaje simple qué pasa con el dinero/clases ya acumulados al cambiar de
// esquema — nada se borra nunca; lo que no aplica al esquema nuevo simplemente queda "dormido"
// hasta que el club vuelva a ese esquema (por eso volver atrás siempre funciona igual).
function textoAdvertenciaCambioEsquema(desde, hacia) {
  const nombres = { MENSUALIDAD: 'Mensualidad', PAQUETE: 'Paquetes de Clases', POR_CLASE: 'Pago por Clase' }
  const base = `Vas a cambiar el esquema de cobro de "${nombres[desde]}" a "${nombres[hacia]}".\n\n`

  if (hacia === 'PAQUETE') {
    return base +
      '• Desde ahora, cada clase asistida descuenta de "Clases Disponibles" de cada deportista (no de dinero).\n' +
      '• El Saldo a Favor (abono) y las deudas pendientes de mensualidad/clase que tengan tus clientes NO se borran ni se cobran automáticamente — quedan guardados y dejan de usarse mientras estés en Paquetes.\n' +
      '• No podrás registrar nuevos abonos de dinero mientras el club esté en este esquema (usa "Comprar Paquete" en su lugar).\n' +
      '• Si más adelante vuelves a Mensualidad o Por Clase, ese saldo/deudas reaparecen exactamente como estaban.\n\n' +
      '¿Confirmas el cambio?'
  }
  if (desde === 'PAQUETE') {
    return base +
      '• Las "Clases Disponibles" de tus deportistas dejan de usarse (no se borran) mientras el club no vuelva a Paquetes.\n' +
      '• No podrás vender nuevos paquetes mientras el club esté en este esquema.\n' +
      '• El Saldo a Favor y las deudas de mensualidad/clase vuelven a aplicarse con normalidad desde hoy.\n\n' +
      '¿Confirmas el cambio?'
  }
  return base +
    '• El Saldo a Favor (abono) de tus clientes se conserva y se sigue aplicando igual bajo el nuevo esquema.\n' +
    '• Las deudas pendientes se recalculan según las reglas del esquema nuevo a partir de hoy — lo ya cobrado no cambia.\n\n' +
    '¿Confirmas el cambio?'
}

async function guardarEsquemaCobro() {
  if (esquemaCobro.value === esquemaCobroOriginal.value) return
  if (!confirm(textoAdvertenciaCambioEsquema(esquemaCobroOriginal.value, esquemaCobro.value))) return

  errorEsquema.value = ''
  exitoEsquema.value = false
  guardandoEsquema.value = true
  try {
    await axios.put('/api/config/cobro', { esquemaCobro: esquemaCobro.value })
    esquemaCobroOriginal.value = esquemaCobro.value
    exitoEsquema.value = true
  } catch (e) {
    errorEsquema.value = e.response?.data?.error || 'Error al guardar el esquema de cobro.'
  } finally {
    guardandoEsquema.value = false
  }
}

onMounted(() => {
  cargarEsquemaCobro()
})
</script>

<style scoped>
.esquema-view {
  padding: var(--space-6) 0;
  max-width: 880px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.esquema-nav {
  margin-bottom: var(--space-1);
}

.esquema-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.esquema-back-link:hover {
  color: var(--orange-500);
}

.esquema-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.esquema-header__icon {
  font-size: 2.2rem;
  line-height: 1;
}

.esquema-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.esquema-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.45;
}

.esquema-inline-link {
  color: var(--orange-500);
  text-decoration: none;
  font-weight: 600;
}

.esquema-inline-link:hover {
  text-decoration: underline;
}

.esquema-main-card {
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.esquema-loading {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding: var(--space-4) 0;
}

.cobros-esquema-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.cobros-esquema-card {
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  position: relative;
  transition: all 0.2s ease;
}

.cobros-esquema-card:hover {
  border-color: var(--orange-400, #fb923c);
  transform: translateY(-1px);
}

.cobros-esquema-card--selected {
  border-color: var(--orange-500) !important;
  background: rgba(249, 115, 22, 0.06);
}

.cobros-esquema-card__radio {
  position: absolute;
  opacity: 0;
}

.cobros-esquema-card__icon {
  font-size: 1.5rem;
}

.cobros-esquema-card__body strong {
  display: block;
  font-size: 0.95rem;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.cobros-esquema-card__body span {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.35;
}

.cobros-esquema-card__check {
  margin-left: auto;
  color: var(--orange-500);
  font-weight: bold;
  font-size: 1.1rem;
}

.esquema-alert {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: var(--space-3);
}

.esquema-alert--danger {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.3);
}

.esquema-alert--success {
  background: rgba(220, 38, 38, 0.12);
  color: #16a34a;
  background-color: rgba(22, 163, 74, 0.12);
  border: 1px solid rgba(22, 163, 74, 0.3);
}

.esquema-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-primary);
}

.btn-esquema-primary {
  padding: 10px 24px;
  background: var(--orange-500);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background var(--transition-fast), opacity var(--transition-fast);
}

.btn-esquema-primary:hover:not(:disabled) {
  background: var(--orange-600);
}

.btn-esquema-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-esquema-secondary {
  display: inline-block;
  padding: 9px 18px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.btn-esquema-secondary:hover {
  border-color: var(--border-hover, #cbd5e1);
  color: var(--text-primary);
}
</style>
