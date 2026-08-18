<template>
  <div class="container portal-container">
    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="text-muted">Cargando informaci&oacute;n del portal...</p>
    </div>

    <div v-else-if="error" class="alert alert-danger text-center py-5">
      <h4 class="mb-3">&#9888;&#65039; Enlace inv&aacute;lido</h4>
      <p>{{ error }}</p>
      <p class="text-muted small">Verifica que el enlace sea correcto o contacta al administrador.</p>
    </div>

    <div v-else class="portal-content">
      <!-- Encabezado del padre -->
      <div class="card shadow-sm mb-4 border-0 text-white text-center"
           :style="{ background: 'linear-gradient(135deg, #111827, #1f2937)' }">
        <div class="card-body py-4 position-relative">
          <div class="position-absolute top-0 end-0 mt-3 me-3">
            <span v-if="esquemaCobro === 'MENSUALIDAD'" class="badge bg-primary px-3 py-2 shadow-sm rounded-pill">📅 Plan Mensualidad</span>
            <span v-if="esquemaCobro === 'PAQUETE'" class="badge bg-warning text-dark px-3 py-2 shadow-sm rounded-pill">📦 Plan Paquetes</span>
            <span v-if="esquemaCobro === 'POR_CLASE'" class="badge bg-info text-dark px-3 py-2 shadow-sm rounded-pill">⚡ Pago por Clase</span>
          </div>
          <h3 class="mb-0 text-white fw-bold" style="font-size: 1.65rem;">{{ padre.nombreCompleto }}</h3>
        </div>
      </div>

      <!-- Estado de cuenta -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body text-center p-3">
              <div class="text-muted mb-1" style="font-size: 0.95rem;">Total a Pagar</div>
              <div class="fs-3 fw-bold text-dark">
                ${{ formatearDinero(totalAPagar) }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body text-center p-3">
              <template v-if="esquemaCobro === 'PAQUETE'">
                <div class="text-muted mb-1" style="font-size: 0.95rem;">Clases Disponibles</div>
                <div class="fs-3 fw-bold" :class="totalClasesDisponibles < 0 ? 'text-danger' : 'text-success'">
                  {{ totalClasesDisponibles }}
                </div>
              </template>
              <template v-else>
                <div class="text-muted mb-1" style="font-size: 0.95rem;">Saldo a Favor (Abono)</div>
                <div class="fs-3 fw-bold text-success">
                  ${{ formatearDinero(padre.saldoAbono || 0) }}
                </div>
              </template>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body text-center p-3">
              <div class="text-muted mb-1" style="font-size: 0.95rem;">Deportistas</div>
              <div class="fs-3 fw-bold text-dark">{{ estudiantes.length }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Deportistas -->
      <div class="card shadow-sm mb-4 border-0">
        <div class="card-body">
          <h4 class="card-title mb-3 text-center" style="font-size: 1.35rem; font-weight: 600;">👥 Deportistas</h4>
          <div v-if="estudiantes.length === 0" class="text-muted text-center py-3">
            No hay deportistas registrados.
          </div>
          <div v-else class="row g-2">
            <div v-for="est in estudiantes" :key="est.id" class="col-md-6">
                <div class="d-flex align-items-center p-2 rounded"
                     style="background: var(--bg-tertiary);">
                  <div class="rounded-circle text-white d-flex align-items-center justify-content-center me-2"
                       style="width: 40px; height: 40px; font-size: 16px; flex-shrink: 0; background: #f97316; font-weight: bold;">
                    {{ est.nombreCompleto ? est.nombreCompleto.charAt(0).toUpperCase() : '?' }}
                  </div>
                  <div>
                    <div class="fw-semibold" style="font-size: 1.05rem;">{{ est.nombreCompleto }}</div>
                    <div class="text-muted" style="font-size: 14px;">
                      <span v-for="mat in (est.matriculas || []).slice(0, 1)" :key="mat.id || 0"
                            class="badge rounded-pill px-2 py-1"
                            :style="{ fontSize: '0.80rem', backgroundColor: colorDeNivel(mat.nivel), color: 'white' }">
                        {{ textoNivel(mat.nivel) || 'Sin nivel' }}
                      </span>
                      <span v-if="!(est.matriculas && est.matriculas.length > 0)"
                            class="badge rounded-pill px-2 py-1 bg-secondary"
                            style="font-size: 0.80rem;">Sin nivel</span>
                    </div>
                    <div v-if="(est.matriculas || []).some(m => m.plan)" class="text-muted" style="font-size: 12px;">
                      📋 Plan: {{ (est.matriculas || []).filter(m => m.plan).map(m => m.plan).join(', ') }}
                    </div>
                    <div v-if="(est.complementos || []).length > 0" class="text-muted" style="font-size: 12px;">
                      🧩 {{ est.complementos.map(c => c.nombre).join(', ') }}
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>

      <!-- 1. Deudas pendientes (se oculta si no hay deudas) -->
      <div v-if="deudas.length > 0" class="card shadow-sm mb-4 border-0">
        <div class="card-body p-3">
          <h5 class="fw-bold text-dark d-flex align-items-center justify-content-center gap-2 mb-3" style="font-size: 1.3rem;">
            <span>📋</span> Deudas Pendientes
          </h5>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 text-start">
              <thead>
                <tr>
                  <th class="text-muted fw-semibold py-2" style="font-size: 0.95rem;">Deportista</th>
                  <th class="text-muted fw-semibold py-2" style="font-size: 0.95rem;">Fecha</th>
                  <th class="text-muted fw-semibold py-2" style="font-size: 0.95rem;">Concepto</th>
                  <th class="text-muted fw-semibold py-2 text-end" style="font-size: 0.95rem;">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="deuda in deudas" :key="String(deuda.id) + '-' + (deuda.tipo || 'clase')">
                  <!-- Deportista -->
                  <td class="fw-semibold text-dark py-2" style="font-size: 0.95rem;">
                    <span v-if="deuda.tipo === 'CARGO_EXTRA'">
                      {{ obtenerNombreDesdeConcepto(deuda.concepto) }}
                    </span>
                    <span v-else>{{ deuda.student?.nombreCompleto || deuda.nombreEstudianteHistorico || 'Deportista' }}</span>
                  </td>
                  <!-- Fecha -->
                  <td class="text-secondary py-2" style="font-size: 0.95rem;">
                    {{ formatearFecha(deuda.fecha) }}
                  </td>
                  <!-- Concepto -->
                  <td class="py-2" style="font-size: 0.95rem;">
                    <span v-if="deuda.tipo === 'CARGO_EXTRA'" class="text-secondary">
                      {{ obtenerSoloConcepto(deuda.concepto) }}
                    </span>
                    <span v-else-if="esquemaCobro === 'MENSUALIDAD'" class="text-secondary">{{ deuda.concepto || descripcionNivel(deuda.nivel) }}</span>
                    <span v-else class="text-secondary">{{ descripcionNivel(deuda.nivel) }}</span>
                  </td>
                  <!-- Monto -->
                  <td class="fw-bold text-dark py-2 text-end" style="font-size: 0.95rem;">
                    ${{ formatearDinero(deuda.precioCobrado || deuda.monto) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Totales / Desglose -->
          <div class="bg-light p-3 border-top mt-3 rounded-2" style="font-size: 0.95rem;">
            <div class="d-flex justify-content-between text-muted mb-2">
              <span>Subtotal de deudas:</span>
              <span class="fw-semibold text-dark">${{ formatearDinero(subtotalDeudas) }}</span>
            </div>
            <div v-if="Number(padre.saldoAbono || 0) > 0" class="d-flex justify-content-between text-muted mb-2">
              <span>Menos Abono aplicado:</span>
              <span class="text-success fw-semibold">-${{ formatearDinero(padre.saldoAbono || 0) }}</span>
            </div>
            <hr class="my-2">
            <div class="d-flex justify-content-between align-items-center">
              <span class="fs-5 fw-bold text-dark" style="font-size: 1.25rem;">Total a pagar:</span>
              <span class="fs-3 fw-bold text-dark" style="font-size: 1.5rem;">${{ formatearDinero(totalAPagar) }}</span>
            </div>
          </div>
          <div class="mt-4" v-if="totalAPagar > 0">
            <!-- Asumiendo que el backend envía la publicKey o sabemos que el club está configurado -->
            <WompiPaymentWidget 
              :monto="totalAPagar" 
              :clubId="padre.clubId" 
              :secretToken="padre.secretToken" 
            />
          </div>
        </div>
      </div>

      <!-- 2. Últimas Clases Asistidas -->
      <div class="card shadow-sm mb-4 border-0">
        <div class="card-body p-3">
          <h5 class="fw-bold text-dark d-flex align-items-center justify-content-center gap-2 mb-3" style="font-size: 1.3rem;">
            <span>🏆</span> Últimas Clases Asistidas
          </h5>
          <div v-if="ultimasClases.length === 0" class="text-center py-3 text-muted" style="font-size: 0.95rem;">
            Aún no hay clases registradas para este periodo.
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0 text-start">
              <thead>
                <tr>
                  <th class="text-muted fw-semibold py-2" style="font-size: 0.95rem;">Deportista</th>
                  <th class="text-muted fw-semibold py-2" style="font-size: 0.95rem;">Fecha</th>
                  <th class="text-muted fw-semibold py-2" style="font-size: 0.95rem;">Nivel / Grupo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="clase in ultimasClases" :key="clase.id">
                  <td class="fw-semibold text-dark py-2" style="font-size: 0.95rem;">
                    {{ clase.student?.nombreCompleto || clase.nombreEstudianteHistorico || '-' }}
                    <span v-if="clase.esCortesia" class="badge bg-warning text-dark fw-bold ms-1" style="font-size: 0.7rem;">🎟 Cortesía</span>
                  </td>
                  <td class="text-secondary py-2" style="font-size: 0.95rem;">
                    {{ formatearFecha(clase.fecha) }}
                  </td>
                  <td class="py-2">
                    <span class="badge rounded-pill px-2 py-1 text-white fw-bold shadow-sm"
                          :style="{ fontSize: '0.78rem', backgroundColor: colorDeNivel(clase.nivel) }">
                      {{ textoNivel(clase.nivel) || 'Clase' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 3. Historial de Movimientos -->
      <div class="card shadow-sm border-0 mb-4">
        <div class="card-body p-3">
          <h5 class="fw-bold text-dark d-flex align-items-center justify-content-center gap-2 mb-3" style="font-size: 1.3rem;">
            <span>📊</span> Historial de Movimientos
          </h5>
          <div v-if="financialLogs.length === 0" class="text-center py-3 text-muted" style="font-size: 0.95rem;">
            No hay movimientos registrados.
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0 text-start">
              <thead>
                <tr>
                  <th class="text-muted fw-semibold py-2" style="font-size: 0.95rem;">Movimiento</th>
                  <th class="text-muted fw-semibold py-2" style="font-size: 0.95rem;">Fecha</th>
                  <th class="text-muted fw-semibold py-2 text-end" style="font-size: 0.95rem;">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in logsLimitados" :key="log.id">
                  <td class="fw-semibold text-dark py-2" style="font-size: 0.95rem;">
                    {{ descripcionMovimiento(log) }}
                  </td>
                  <td class="text-secondary py-2" style="font-size: 0.95rem;">
                    {{ formatearFecha(log.fecha) }}
                  </td>
                  <td class="fw-bold text-success py-2 text-end" style="font-size: 0.95rem;">
                    +${{ formatearDinero(log.monto) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-4 mb-3">
        <small class="text-muted" style="font-size: 0.85rem;">Asistencias ERP &mdash; Portal de Padres</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { formatearFecha, formatearDinero } from '@/utils/formatters'
import WompiPaymentWidget from '@/components/WompiPaymentWidget.vue'

const route = useRoute()

const cargando = ref(true)
const error = ref(null)
const padre = ref({})
const estudiantes = ref([])
const financialLogs = ref([])
const deudas = ref([])
const deudaTotal = ref(0)
const ultimasClases = ref([])
const esquemaCobro = ref('MENSUALIDAD')
const clubConfig = ref({})
const logsLimitados = computed(() => {
  return financialLogs.value
    .filter(log => log.tipoMovimiento === 'INGRESO_ABONO' || log.tipoMovimiento === 'PAGO_DIRECTO')
    .slice(0, 5)
})

const subtotalDeudas = computed(() => {
  return Number(deudaTotal.value || 0)
})

const totalAPagar = computed(() => {
  const totalDeuda = Number(deudaTotal.value || 0)
  const saldo = Number(padre.value.saldoAbono || 0)
  return Math.max(0, totalDeuda - saldo)
})

const totalClasesDisponibles = computed(() => {
  return estudiantes.value.reduce((sum, e) => sum + Number(e.clasesDisponibles || 0), 0)
})

function descripcionMovimiento(log) {
  if (log.tipoMovimiento === 'INGRESO_ABONO') {
    return log.metodoPago === 'TRANSFERENCIA' ? 'Abono (Transferencia)' : 'Abono (Efectivo)'
  }
  if (log.tipoMovimiento === 'PAGO_DIRECTO') {
    const metodo = log.metodoPago ? ` (${log.metodoPago})` : ''
    return (log.concepto || 'Pago directo') + metodo
  }
  return log.concepto || log.tipoMovimiento || 'Movimiento'
}

// Mapa de estilos con llaves normalizadas a minúsculas (para match case-insensitive)
const estilosLookup = ref({})

function obtenerEstiloGrupo(nombreNivel) {
  if (!nombreNivel) return null;
  const trimmed = nombreNivel.trim();
  const key = trimmed.toLowerCase();
  // Intento directo con llave normalizada (tolowercase + trim)
  if (estilosLookup.value[key]) return estilosLookup.value[key];
  // Fallback: si empieza con un emoji, extraer el texto y buscar normalizado
  const partes = trimmed.split(/\s+/);
  if (partes.length > 1) {
    const cleanKey = partes.slice(1).join(' ').toLowerCase();
    if (estilosLookup.value[cleanKey]) return estilosLookup.value[cleanKey];
  }
  return null;
}

function colorDeNivel(nivel) {
  if (!nivel) return '#6c757d';
  const estilo = obtenerEstiloGrupo(nivel);
  return estilo?.colorHex || '#6c757d';
}

function textoNivel(nivel) {
  if (!nivel) return 'Sin nivel';
  const estilo = obtenerEstiloGrupo(nivel);
  if (estilo) {
    // Obtener nombre limpio (sin emoji que pudiera venir del dato original)
    const nombreLimpio = nivel.startsWith(estilo.emoji)
      ? nivel.slice(estilo.emoji.length).trim()
      : nivel.trim();
    return `${estilo.emoji} ${nombreLimpio}`;
  }
  return nivel;
}


function descripcionNivel(nivel) {
  if (!nivel) return 'Clase'
  // Extrae el nombre sin el emoji si existe
  const partes = nivel.trim().split(' ')
  return partes.length > 1 ? partes.slice(1).join(' ') : nivel
}

function limpiarConcepto(concepto) {
  if (!concepto) return 'Cargo pendiente'
  return concepto.replace(/\s*\(\$[^)]+\)\s*$/, '').trim()
}

function obtenerNombreDesdeConcepto(concepto) {
  const limpio = limpiarConcepto(concepto)
  const partes = limpio.split(' - ')
  if (partes.length > 1) {
    return partes[partes.length - 1].trim()
  }
  return 'Deportista'
}

function obtenerSoloConcepto(concepto) {
  const limpio = limpiarConcepto(concepto)
  const partes = limpio.split(' - ')
  if (partes.length > 1) {
    return partes.slice(0, -1).join(' - ').trim()
  }
  return limpio
}

onMounted(async () => {
  const token = route.params.token
  if (!token) {
    error.value = 'No se proporcion&oacute; un token de acceso.'
    cargando.value = false
    return
  }

  try {
    const res = await axios.get(`/api/public/portal/${token}`)
    const data = res.data
    console.log("🔍 Datos del Portal:", data)
    padre.value = data.parent
    const estudiantesRaw = data.parent?.students || []
    financialLogs.value = data.financialLogs || []
    // El servidor ahora retorna una lista unificada de clases + cargos extras
    deudas.value = data.deudas || []
    // deudaTotal ya viene calculado correctamente desde el servidor (incluye cargos extras)
    deudaTotal.value = data.deudaTotal || 0

    clubConfig.value = data.clubConfig || {}
    esquemaCobro.value = clubConfig.value.esquemaCobro || 'MENSUALIDAD'

    // Enriquecer estudiantes: si un deportista no tiene matrículas, buscar su nivel
    const todasLasAsistencias = [...(data.ultimasClases || []), ...(data.deudas || [])]
    const estudiantesEnriquecidos = [];
    for (const est of estudiantesRaw) {
      const estEnriquecido = { ...est }
      if (!estEnriquecido.matriculas || estEnriquecido.matriculas.length === 0) {
        const match = todasLasAsistencias.find(
          a => (a.student?.id === est.id) || (a.nombreEstudianteHistorico === est.nombreCompleto)
        );
        if (match && match.nivel) {
          estEnriquecido.matriculas = [{ id: 0, nivel: match.nivel, sede: null }];
        }
      }
      estudiantesEnriquecidos.push(estEnriquecido);
    }
    estudiantes.value = estudiantesEnriquecidos

    const raw = data.estilosGrupos || {};
    const normalizados = {};
    for (const [key, val] of Object.entries(raw)) {
      normalizados[key.toLowerCase().trim()] = val;
    }
    estilosLookup.value = normalizados;

    // Limitar las últimas clases para la tabla de visualización
    ultimasClases.value = (data.ultimasClases || []).slice(0, 3)

  } catch (e) {
    if (e.response && e.response.status === 404) {
      error.value = 'Enlace no encontrado o inv&aacute;lido. Verifica que el enlace sea correcto.'
    } else if (e.response && e.response.status === 403 && e.response.data?.mensaje) {
      error.value = e.response.data.mensaje
    } else {
      error.value = e.message || 'Error al cargar la informaci&oacute;n del portal.'
    }
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.portal-container {
  max-width: 1000px;
  margin: 0 auto;
  min-height: 100vh;
  font-size: 1.05rem;
}

.card {
  border: 1px solid var(--border-primary) !important;
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  border-bottom: none;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

.list-group-item {
  background-color: transparent !important;
  color: var(--text-primary) !important;
  border-color: var(--border-primary) !important;
}

.list-group-item:hover {
  background-color: rgba(255, 255, 255, 0.02) !important;
}

.bg-light {
  background-color: var(--bg-tertiary) !important;
  color: var(--text-secondary) !important;
}

.portal-list-item {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
  padding-left: 16px !important;
  padding-right: 16px !important;
}
</style>
