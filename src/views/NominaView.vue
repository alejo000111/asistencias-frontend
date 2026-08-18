<template>
  <div class="nomina-view">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
      <div>
        <h3 class="mb-0">💵 Nómina de Entrenadores</h3>
        <p class="text-secondary small mb-0">Lista cada clase dictada por los empleados en el rango de fechas para marcar cuáles ya se pagaron.</p>
      </div>
      <button class="btn btn-primary fw-bold shadow-sm" :disabled="exportando" @click="exportarExcel">
        <span v-if="exportando" class="spinner-border spinner-border-sm"></span>
        <span v-else>📥 Exportar Excel</span>
      </button>
    </div>

    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <label class="form-label fw-semibold small d-block mb-2">Rango de fechas</label>
        <div class="d-flex flex-wrap gap-2 mb-3">
          <button
            v-for="preset in presets"
            :key="preset.key"
            type="button"
            class="btn btn-sm fw-semibold"
            :class="rangoActivo === preset.key ? 'btn-primary' : 'btn-outline-secondary'"
            @click="aplicarPreset(preset.key)"
          >
            {{ preset.label }}
          </button>
        </div>

        <div class="row g-3 align-items-end">
          <div class="col-md-3" v-if="rangoActivo === 'PERSONALIZADO'">
            <label class="form-label fw-semibold small">Desde</label>
            <input type="date" v-model="fechaDesde" class="form-control" @change="rangoActivo = 'PERSONALIZADO'" />
          </div>
          <div class="col-md-3" v-if="rangoActivo === 'PERSONALIZADO'">
            <label class="form-label fw-semibold small">Hasta</label>
            <input type="date" v-model="fechaHasta" class="form-control" @change="rangoActivo = 'PERSONALIZADO'" />
          </div>
          <div class="col-md-3">
            <label class="form-label fw-semibold small">Entrenador</label>
            <select v-model="empleadoId" class="form-select">
              <option :value="null">Todos los entrenadores</option>
              <option v-for="emp in entrenadoresDisponibles" :key="emp.id" :value="emp.id">{{ emp.nombreCompleto }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label fw-semibold small">Sede</label>
            <select v-model="sedeId" class="form-select">
              <option :value="null">Todas las sedes</option>
              <option v-for="sede in sedes" :key="sede.id" :value="sede.id">{{ sede.nombre }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label fw-semibold small">Estado de pago</label>
            <select v-model="estadoPago" class="form-select">
              <option value="TODOS">Todos</option>
              <option value="PENDIENTE">Pendientes de pago</option>
              <option value="PAGADO">Ya pagadas</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="d-flex flex-wrap gap-3 mb-3 align-items-center">
      <div class="badge bg-light text-dark border px-3 py-2 fs-6">Clases: <strong>{{ clases.length }}</strong></div>
      <div class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 fs-6">Por pagar: <strong>{{ formatCOP(totalPendiente) }}</strong></div>
      <button
        v-if="seleccionadas.size > 0"
        type="button"
        class="btn btn-success btn-sm fw-semibold ms-auto"
        @click="abrirPanelPago(clasesSeleccionadasPendientes)"
      >
        💰 Marcar {{ seleccionadas.size }} seleccionada{{ seleccionadas.size === 1 ? '' : 's' }} como pagada{{ seleccionadas.size === 1 ? '' : 's' }}
      </button>
    </div>

    <!-- Panel para registrar fecha y medio de pago, tanto para una sola clase como para varias seleccionadas -->
    <div v-if="panelPago" class="card shadow-sm mb-3 border-success">
      <div class="card-body">
        <h6 class="fw-bold mb-3">Registrar pago de {{ panelPago.clases.length }} clase{{ panelPago.clases.length === 1 ? '' : 's' }}</h6>
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label fw-semibold small">Fecha de pago</label>
            <input type="date" v-model="panelPago.fecha" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold small">Medio de pago</label>
            <select v-model="panelPago.metodo" class="form-select">
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>
          <div class="col-md-4 d-flex gap-2">
            <button type="button" class="btn btn-success fw-semibold flex-grow-1" :disabled="registrandoPago" @click="confirmarPago">
              {{ registrandoPago ? '⏳ Guardando...' : '✅ Confirmar Pago' }}
            </button>
            <button type="button" class="btn btn-outline-secondary" @click="panelPago = null">Cancelar</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card shadow-sm">
      <div class="card-body p-0">
        <table class="table table-hover mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th style="width: 2.5rem;">
                <input type="checkbox" class="form-check-input" :checked="todasSeleccionadas" @change="alternarSeleccionarTodas" title="Seleccionar todas las pendientes" />
              </th>
              <th>Fecha</th>
              <th>Entrenador</th>
              <th>Sede</th>
              <th>Nivel / Grupo</th>
              <th v-if="mostrarColumnaTipo">Tipo</th>
              <th class="text-end">Valor</th>
              <th class="text-center">Estado</th>
              <th>Fecha de pago</th>
              <th>Medio de pago</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="clase in clases" :key="clase.attendanceIds.join('-')">
              <td>
                <input
                  type="checkbox"
                  class="form-check-input"
                  :checked="seleccionadas.has(clase.attendanceIds.join('-'))"
                  :disabled="clase.pagadoNomina"
                  @change="alternarSeleccion(clase)"
                />
              </td>
              <td>{{ formatFecha(clase.fecha) }}</td>
              <td class="fw-bold">{{ clase.nombreEmpleado }}</td>
              <td>{{ clase.sedeNombre || '—' }}</td>
              <td>{{ clase.niveles && clase.niveles.length ? clase.niveles.join(', ') : '—' }}</td>
              <td v-if="mostrarColumnaTipo">{{ clase.tipoClase || (clase.niveles.length > 1 ? 'Mixto' : '—') }}</td>
              <td class="text-end">{{ formatCOP(clase.tarifa) }}</td>
              <td class="text-center">
                <button
                  v-if="clase.pagadoNomina"
                  type="button"
                  class="btn btn-sm fw-semibold btn-success"
                  :disabled="actualizandoClaseKey === clase.attendanceIds.join('-')"
                  @click="marcarClase(clase, false)"
                >
                  ✅ Pagada
                </button>
                <button
                  v-else
                  type="button"
                  class="btn btn-sm fw-semibold btn-outline-warning"
                  @click="abrirPanelPago([clase])"
                >
                  ⏳ Pendiente
                </button>
              </td>
              <td>{{ clase.pagadoNomina ? formatFecha(clase.fechaPago) : '—' }}</td>
              <td>{{ clase.pagadoNomina ? formatMedioPago(clase.metodoPago) : '—' }}</td>
            </tr>
            <tr v-if="!cargando && clases.length === 0">
              <td :colspan="mostrarColumnaTipo ? 10 : 9" class="text-center text-muted py-4">No hay clases registradas por empleados con estos filtros.</td>
            </tr>
            <tr v-if="cargando">
              <td :colspan="mostrarColumnaTipo ? 10 : 9" class="text-center text-muted py-4">
                <span class="spinner-border spinner-border-sm me-2"></span>Cargando clases...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'

const clases = ref([])
const empleados = ref([])
const sedes = ref([])
const cargando = ref(false)
const exportando = ref(false)
const actualizandoClaseKey = ref(null)

// Selección múltiple: para marcar como pagadas varias sesiones/clases a la vez (p.ej. varios
// entrenadores pagados el mismo día con el mismo medio de pago), igual que el checkbox de
// asistencia por fila en HomeView.
const seleccionadas = ref(new Set())
const panelPago = ref(null) // { clases: [ClaseNominaDTO], fecha, metodo }
const registrandoPago = ref(false)

function claveDe(clase) {
  return clase.attendanceIds.join('-')
}

function alternarSeleccion(clase) {
  const clave = claveDe(clase)
  const nuevo = new Set(seleccionadas.value)
  if (nuevo.has(clave)) nuevo.delete(clave)
  else nuevo.add(clave)
  seleccionadas.value = nuevo
}

const clasesPendientes = computed(() => clases.value.filter(c => !c.pagadoNomina))
const todasSeleccionadas = computed(() =>
  clasesPendientes.value.length > 0 && clasesPendientes.value.every(c => seleccionadas.value.has(claveDe(c)))
)

function alternarSeleccionarTodas() {
  if (todasSeleccionadas.value) {
    seleccionadas.value = new Set()
  } else {
    seleccionadas.value = new Set(clasesPendientes.value.map(claveDe))
  }
}

const clasesSeleccionadasPendientes = computed(() =>
  clasesPendientes.value.filter(c => seleccionadas.value.has(claveDe(c)))
)

function abrirPanelPago(listaClases) {
  if (!listaClases.length) return
  panelPago.value = {
    clases: listaClases,
    fecha: toISODate(new Date()),
    metodo: 'EFECTIVO',
  }
}

async function confirmarPago() {
  if (!panelPago.value) return
  const attendanceIds = panelPago.value.clases.flatMap(c => c.attendanceIds)
  registrandoPago.value = true
  try {
    await axios.patch('/api/nomina/clases/pago', {
      attendanceIds,
      pagado: true,
      fechaPago: panelPago.value.fecha,
      metodoPago: panelPago.value.metodo,
    })
    seleccionadas.value = new Set()
    panelPago.value = null
    await cargarClases()
  } catch (e) {
    alert(mensajeError(e, 'registrar el pago'))
  } finally {
    registrandoPago.value = false
  }
}

function formatMedioPago(metodo) {
  if (metodo === 'EFECTIVO') return 'Efectivo'
  if (metodo === 'TRANSFERENCIA') return 'Transferencia'
  return metodo || '—'
}

// El "Tipo" (Grupal / Personalizada) solo tiene sentido en el esquema Por Clase (asistencia):
// en Mensualidad y Paquete todas las clases son grupales, así que la columna sobra.
const clubConfig = ref(null)
const mostrarColumnaTipo = computed(() => !clubConfig.value || clubConfig.value.esquemaCobro === 'POR_CLASE')

async function cargarClubConfig() {
  try {
    const res = await axios.get('/api/config/cobro')
    clubConfig.value = res.data
  } catch (e) {
    clubConfig.value = null
  }
}

function toISODate(d) {
  return d.toISOString().slice(0, 10)
}

function primerDiaDelMes(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function ultimoDiaDelMes(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function lunesDeLaSemana(d = new Date()) {
  const fecha = new Date(d)
  const dia = fecha.getDay() // 0 = domingo
  const diff = dia === 0 ? -6 : 1 - dia
  fecha.setDate(fecha.getDate() + diff)
  return fecha
}

const presets = [
  { key: 'ESTA_SEMANA', label: '📆 Esta semana' },
  { key: 'ESTE_MES', label: '🗓️ Este mes' },
  { key: 'SEMANA_PASADA', label: '⏮️ Semana pasada' },
  { key: 'MES_PASADO', label: '⏮️ Mes pasado' },
  { key: 'PERSONALIZADO', label: '🔧 Personalizado' },
]

const rangoActivo = ref('ESTE_MES')
const fechaDesde = ref(toISODate(primerDiaDelMes()))
const fechaHasta = ref(toISODate(new Date()))
const empleadoId = ref(null)
const sedeId = ref(null)
const estadoPago = ref('TODOS')

function aplicarPreset(key) {
  rangoActivo.value = key
  const hoy = new Date()
  if (key === 'ESTA_SEMANA') {
    fechaDesde.value = toISODate(lunesDeLaSemana(hoy))
    fechaHasta.value = toISODate(hoy)
  } else if (key === 'ESTE_MES') {
    fechaDesde.value = toISODate(primerDiaDelMes(hoy))
    fechaHasta.value = toISODate(hoy)
  } else if (key === 'SEMANA_PASADA') {
    const lunesActual = lunesDeLaSemana(hoy)
    const lunesPasado = new Date(lunesActual)
    lunesPasado.setDate(lunesActual.getDate() - 7)
    const domingoPasado = new Date(lunesActual)
    domingoPasado.setDate(lunesActual.getDate() - 1)
    fechaDesde.value = toISODate(lunesPasado)
    fechaHasta.value = toISODate(domingoPasado)
  } else if (key === 'MES_PASADO') {
    const mesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    fechaDesde.value = toISODate(primerDiaDelMes(mesPasado))
    fechaHasta.value = toISODate(ultimoDiaDelMes(mesPasado))
  }
}

// Igual que en el backend (NominaService): un ADMIN exento de nómina no debe poder filtrarse
// como si fuera un entrenador, porque nunca va a aparecer en el reporte.
const entrenadoresDisponibles = computed(() =>
  empleados.value.filter(emp => !(emp.role === 'ADMIN' && emp.exentoNomina))
)

// El total mostrado es lo que falta por pagarle a los entrenadores, no lo que ya se les pagó.
const totalPendiente = computed(() =>
  clases.value.reduce((sum, c) => sum + (c.pagadoNomina ? 0 : (c.tarifa || 0)), 0)
)

function filtrosActuales() {
  return {
    fechaDesde: fechaDesde.value,
    fechaHasta: fechaHasta.value,
    empleadoId: empleadoId.value || undefined,
    sedeId: sedeId.value || undefined,
    estadoPago: estadoPago.value,
  }
}

function mensajeError(e, accion) {
  if (e.response) {
    const status = e.response.status
    if (status === 403) return `No tienes permiso para ${accion}. Vuelve a iniciar sesión como administrador e inténtalo de nuevo.`
    if (status === 404) return 'Esta clase ya no existe (puede haber sido eliminada).'
    if (e.response.data?.error) return e.response.data.error
    if (status >= 500) return `Ocurrió un error en el servidor al ${accion}. Intenta de nuevo en unos segundos.`
    return `No se pudo ${accion} (código ${status}).`
  }
  return `No se pudo conectar con el servidor para ${accion}. Revisa tu conexión.`
}

async function cargarClases() {
  cargando.value = true
  seleccionadas.value = new Set()
  panelPago.value = null
  try {
    const res = await axios.get('/api/nomina/clases', { params: filtrosActuales() })
    clases.value = res.data
  } catch (e) {
    alert(mensajeError(e, 'cargar las clases'))
  } finally {
    cargando.value = false
  }
}

async function marcarClase(clase, pagado) {
  const key = clase.attendanceIds.join('-')
  actualizandoClaseKey.value = key
  try {
    await axios.patch('/api/nomina/clases/pago', { attendanceIds: clase.attendanceIds, pagado })
    await cargarClases()
  } catch (e) {
    alert(mensajeError(e, 'actualizar el estado de pago'))
  } finally {
    actualizandoClaseKey.value = null
  }
}

async function cargarEmpleados() {
  try {
    const res = await axios.get('/api/empleados')
    empleados.value = res.data
  } catch (e) {
    console.error('Error al cargar empleados:', e)
  }
}

async function cargarSedes() {
  try {
    const res = await axios.get('/api/sedes')
    sedes.value = res.data
  } catch (e) {
    console.error('Error al cargar sedes:', e)
  }
}

async function exportarExcel() {
  exportando.value = true
  try {
    const res = await axios.get('/api/nomina/exportar', {
      params: filtrosActuales(),
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'reporte_nomina.xlsx')
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (e) {
    console.error('Error al exportar nómina:', e)
    alert('Error al exportar la nómina.')
  } finally {
    exportando.value = false
  }
}

function formatCOP(val) {
  if (val == null) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)
}

function formatFecha(val) {
  if (!val) return '—'
  // val llega como "yyyy-MM-dd" (LocalDate, sin hora: la sesión unifica el día completo)
  const [anio, mes, dia] = val.split('-')
  return `${dia}/${mes}/${anio}`
}

watch([fechaDesde, fechaHasta, empleadoId, sedeId, estadoPago], cargarClases)

onMounted(async () => {
  await Promise.all([cargarEmpleados(), cargarSedes(), cargarClubConfig(), cargarClases()])
})
</script>

<style scoped>
.nomina-view { padding: 20px 0; }
</style>
