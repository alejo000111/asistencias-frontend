import { ref } from 'vue'
import axios from 'axios'

// Estado compartido (module-level, mismo patrón que useSedes.js): planes de mensualidad
// agrupados por sedeId. La tabla comparativa de Ajustes de Cobro los carga todos de una
// sola consulta y los edita en sitio.
const planesPorSede = ref({})

export function usePlanesMensualidad() {
  /** Carga los planes de UNA sede (lo usa el selector de plan del perfil del deportista). */
  async function cargarPlanesDeSede(sedeId, force = false) {
    if (!sedeId) return
    if (!force && planesPorSede.value[sedeId]) return
    try {
      const res = await axios.get('/api/planes', { params: { sedeId } })
      planesPorSede.value[sedeId] = (res.data || []).map(normalizarPlan)
    } catch (e) {
      console.error('Error al cargar planes de la sede:', e)
      if (!planesPorSede.value[sedeId]) planesPorSede.value[sedeId] = []
    }
  }

  /** Carga de una sola vez los planes de TODAS las sedes del club. */
  async function cargarTodosLosPlanes() {
    try {
      const res = await axios.get('/api/planes')
      const agrupados = { 'global': [] }
      for (const plan of res.data || []) {
        const sedeId = plan.sede?.id || 'global'
        if (!agrupados[sedeId]) agrupados[sedeId] = []
        agrupados[sedeId].push(normalizarPlan(plan))
      }
      planesPorSede.value = agrupados
    } catch (e) {
      console.error('Error al cargar los planes del club:', e)
      planesPorSede.value = {}
    }
  }

  /**
   * Convierte los cupos que vienen del backend (lista de {escenario, cantidad}) en un
   * mapa escenarioId -> cantidad, que es lo que la tabla necesita para pintar una
   * columna por escenario. `dirty` marca las filas editadas para el guardado único.
   */
  function normalizarPlan(plan) {
    const cupos = {}
    for (const c of plan.cupos || []) {
      const escId = c.escenario?.id ?? c.escenarioId
      if (escId != null) cupos[escId] = c.cantidad
    }
    return { ...plan, cupos, dirty: false }
  }

  function crearPlanVacio(sedeId) {
    if (!planesPorSede.value[sedeId]) planesPorSede.value[sedeId] = []
    planesPorSede.value[sedeId].push({
      id: null,
      sedeId,
      nombre: '',
      montoPreferencial: null,
      montoEstandar: null,
      montoMora: null,
      cupos: {},
      dirty: true
    })
  }

  function construirPayload(sedeId, plan) {
    return {
      sedeId: sedeId === 'global' ? null : sedeId,
      nombre: (plan.nombre || '').trim(),
      montoPreferencial: plan.montoPreferencial,
      montoEstandar: plan.montoEstandar,
      montoMora: plan.montoMora,
      // Solo se envían los escenarios con cantidad > 0: celda vacía significa
      // "este plan no incluye ese escenario".
      cupos: Object.entries(plan.cupos || {})
        .filter(([, cantidad]) => Number(cantidad) > 0)
        .map(([escenarioId, cantidad]) => ({ escenarioId: Number(escenarioId), cantidad: Number(cantidad) }))
    }
  }

  async function guardarPlan(sedeId, plan) {
    if (!plan.nombre || !plan.nombre.trim()) {
      throw new Error('El nombre del plan es obligatorio')
    }
    const payload = construirPayload(sedeId, plan)
    if (plan.id) {
      await axios.put(`/api/planes/${plan.id}`, payload)
    } else {
      await axios.post('/api/planes', payload)
    }
  }

  async function eliminarPlan(sedeId, plan) {
    if (!plan.id) {
      planesPorSede.value[sedeId] = (planesPorSede.value[sedeId] || []).filter(p => p !== plan)
      return
    }
    await axios.delete(`/api/planes/${plan.id}`)
    planesPorSede.value[sedeId] = (planesPorSede.value[sedeId] || []).filter(p => p.id !== plan.id)
  }

  return {
    planesPorSede,
    cargarPlanesDeSede,
    cargarTodosLosPlanes,
    crearPlanVacio,
    guardarPlan,
    eliminarPlan
  }
}
