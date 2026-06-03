<template>
  <div class="container mt-4 portal-container">
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
      <div class="card shadow-sm mb-4 border-0 text-white"
           :style="{ background: 'linear-gradient(135deg, #111827, #1f2937)' }">
        <div class="card-body">
          <h4 class="mb-0">{{ padre.nombreCompleto }}</h4>
        </div>
      </div>

      <!-- Estado de cuenta -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body text-center p-3">
              <div class="text-muted small mb-1">Deuda Total</div>
              <div class="fs-3 fw-bold">
                {{ formatearDinero(deudaTotal) }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body text-center p-3">
              <div class="text-muted small mb-1">Saldo a Favor (Abono)</div>
              <div class="fs-3 fw-bold text-success">
                {{ formatearDinero(Math.max(0, padre.saldoAbono || 0)) }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body text-center p-3">
              <div class="text-muted small mb-1">Deportistas</div>
              <div class="fs-3 fw-bold text-dark">{{ estudiantes.length }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Deportistas -->
      <div class="card shadow-sm mb-4 border-0">
        <div class="card-body">
          <h5 class="card-title mb-3">&#128101; Deportistas</h5>
          <div v-if="estudiantes.length === 0" class="text-muted text-center py-3">
            No hay deportistas registrados.
          </div>
          <div v-else class="row g-2">
            <div v-for="est in estudiantes" :key="est.id" class="col-md-6">
                <div class="d-flex align-items-center p-2 rounded"
                     style="background: #f8f9fa;">
                  <div class="rounded-circle text-white d-flex align-items-center justify-content-center me-2"
                       style="width: 36px; height: 36px; font-size: 14px; flex-shrink: 0; background: #f97316;">
                    {{ est.nombreCompleto ? est.nombreCompleto.charAt(0).toUpperCase() : '?' }}
                  </div>
                  <div>
                    <div class="fw-semibold small">{{ est.nombreCompleto }}</div>
                    <div class="text-muted" style="font-size: 12px;">
                      <span class="badge rounded-pill px-2 py-1" :style="'font-size: 0.70rem;' + (est.nivel === 'AVANZADO' ? 'background-color: #f97316; color: white;' : 'background-color: #10b981; color: white;')">
                        {{ descripcionNivel(est.nivel) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>

      <!-- Últimas Clases Asistidas -->
      <div class="card shadow-sm mb-4 border-0">
        <div class="card-header bg-white">
          <h5 class="mb-0">&#127942; Últimas Clases Asistidas</h5>
        </div>
        <div class="card-body p-0">
          <div v-if="!ultimasClases || ultimasClases.length === 0" class="text-center py-4 text-muted">
            No hay registro de clases recientes.
          </div>
          <div v-else>
            <div class="table-responsive">
              <table class="table table-sm table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Deportista</th>
                    <th>Fecha</th>
                    <th>Nivel</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="clase in ultimasClases" :key="clase.fecha + (clase.nombreEstudiante || '')">
                    <td>{{ clase.nombreEstudiante || '-' }}</td>
                    <td>{{ formatearFecha(clase.fecha) }}</td>
                    <td>
                      <span class="badge rounded-pill px-2 py-1" :style="'font-size: 0.70rem;' + (clase.nivel === 'AVANZADO' ? 'background-color: #f97316; color: white;' : 'background-color: #10b981; color: white;')">
                        {{ descripcionNivel(clase.nivel) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Deudas pendientes -->
      <div class="card shadow-sm mb-4 border-0">
        <div class="card-header bg-white">
          <h5 class="mb-0">&#128203; Deudas Pendientes</h5>
        </div>
        <div class="card-body p-0">
          <div v-if="deudas.length === 0" class="text-center py-4 text-muted">
            No hay deudas pendientes. &#127881;
          </div>
          <div v-else>
            <div class="table-responsive">
              <table class="table table-sm table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Deportista</th>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th class="text-end">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="deuda in deudas" :key="deuda.id">
                    <td>{{ deuda.student?.nombreCompleto || deuda.nombreEstudianteHistorico || '-' }}</td>
                    <td>{{ formatearFecha(deuda.fecha) }}</td>
                    <td>{{ descripcionNivel(deuda.nivel) }}</td>
                    <td class="text-end fw-semibold">{{ formatearDinero(deuda.precioCobrado) }}</td>
                  </tr>
                </tbody>
                <tfoot class="table-light">
                  <tr>
                    <td colspan="3" class="text-end text-muted">Subtotal de clases:</td>
                    <td class="text-end fw-semibold">{{ formatearDinero(subtotalDeudas) }}</td>
                  </tr>
                  <tr v-if="Math.max(0, Number(padre.saldoAbono || 0)) > 0">
                    <td colspan="3" class="text-end text-muted">Menos saldo a favor (Abono):</td>
                    <td class="text-end text-success fw-semibold">-{{ formatearDinero(Math.max(0, padre.saldoAbono || 0)) }}</td>
                  </tr>
                  <tr class="fw-bold">
                    <td colspan="3" class="text-end fs-5 text-dark">Total a pagar:</td>
                    <td class="text-end fs-5 text-dark fw-bold">{{ formatearDinero(totalAPagar) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Historial financiero -->
      <div class="card shadow-sm border-0">
        <div class="card-header bg-white">
          <h5 class="mb-0">&#128202; Historial de Movimientos</h5>
        </div>
        <div class="card-body p-0">
          <div v-if="financialLogs.length === 0" class="text-center py-4 text-muted">
            No hay movimientos registrados.
          </div>
          <div v-else>
            <div class="table-responsive">
              <table class="table table-sm table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th class="text-end">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in logsLimitados" :key="log.id">
                    <td>{{ formatearFecha(log.fecha) }}</td>
                    <td>{{ descripcionMovimiento(log) }}</td>
                    <td class="text-end fw-semibold">
                      {{ log.tipoMovimiento === 'INGRESO_ABONO' ? '+' : '-' }}{{ formatearDinero(log.monto) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-4 mb-3">
        <small class="text-muted">Asistencias ERP &mdash; Portal de Padres</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()

const cargando = ref(true)
const error = ref(null)
const padre = ref({})
const estudiantes = ref([])
const financialLogs = ref([])
const deudas = ref([])
const deudaTotal = ref(0)
const ultimasClases = ref([])

const logsLimitados = computed(() => {
  return financialLogs.value
    .filter(log => log.tipoMovimiento === 'INGRESO_ABONO')
    .slice(0, 3)
})

const subtotalDeudas = computed(() => {
  return Number(deudaTotal.value || 0)
})

const totalAPagar = computed(() => {
  const totalDeuda = Number(deudaTotal.value || 0)
  const abonoValido = Math.max(0, Number(padre.value.saldoAbono || 0))
  return Math.max(0, totalDeuda - abonoValido)
})

function descripcionMovimiento(log) {
  if (log.tipoMovimiento === 'INGRESO_ABONO') {
    return log.metodoPago === 'TRANSFERENCIA' ? 'Transferencia' : 'Efectivo'
  }
  return log.tipoMovimiento || 'Movimiento'
}

function descripcionNivel(nivel) {
  if (nivel === 'AVANZADO') return '🔥 Avanzado'
  return '🌱 Iniciación'
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '-'
  const fecha = new Date(fechaStr + (fechaStr.includes('T') ? '' : 'T00:00:00'))
  return fecha.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatearDinero(valor) {
  if (valor === null || valor === undefined) return '$0'
  const num = Number(valor)
  return '$' + num.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
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
    padre.value = data.parent
    estudiantes.value = data.parent?.students || []
    financialLogs.value = data.financialLogs || []
    deudas.value = data.deudas || []
    deudaTotal.value = data.deudaTotal || 0
    ultimasClases.value = data.ultimasClases || []
  } catch (e) {
    if (e.response && e.response.status === 404) {
      error.value = 'Enlace no encontrado o inv&aacute;lido. Verifica que el enlace sea correcto.'
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
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
}

.card {
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  border-bottom: none;
}

.table > :not(caption) > * > * {
  vertical-align: middle;
  padding: 0.6rem 0.75rem;
}

.table tbody tr:hover {
  filter: brightness(0.97);
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}
</style>
