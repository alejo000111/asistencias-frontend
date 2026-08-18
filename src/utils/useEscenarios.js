import { ref } from 'vue'
import axios from 'axios'

/**
 * Escenarios del club: los espacios donde se dictan las clases (Cancha, Pista,
 * Gimnasio, Sintética, Parque...). No hay lista predefinida — cada admin crea los
 * suyos con el nombre que necesite.
 *
 * Estado compartido a nivel de módulo, igual que useSedes.js, para que todas las
 * vistas lean el mismo catálogo sin repetir la consulta.
 */
const escenarios = ref([])
let cargados = false

export function useEscenarios() {
  async function cargarEscenarios(force = false) {
    if (cargados && !force) return escenarios.value
    try {
      const res = await axios.get('/api/escenarios')
      escenarios.value = res.data || []
      cargados = true
    } catch (e) {
      console.error('Error al cargar escenarios:', e)
      escenarios.value = []
    }
    return escenarios.value
  }

  /** Abreviatura del periodo, para etiquetas compactas de tabla. */
  function abrevPeriodo(escenario) {
    return escenario?.periodo === 'MENSUAL' ? 'mes' : 'sem'
  }

  /** Palabra completa, para textos de aviso ("cuota semanal" / "cuota mensual"). */
  function adjetivoPeriodo(escenario) {
    return escenario?.periodo === 'MENSUAL' ? 'mensual' : 'semanal'
  }

  /**
   * Etiqueta de la columna de cupos: "🛼 Pista /sem", "💪 Gym /mes".
   * Toda etiqueta de días de la app sale de aquí, nunca de texto escrito a mano,
   * para que al renombrar un escenario cambie en todas las pantallas a la vez.
   */
  function etiquetaEscenario(escenario) {
    if (!escenario) return ''
    const emoji = escenario.emoji ? `${escenario.emoji} ` : ''
    return `${emoji}${escenario.nombre} /${abrevPeriodo(escenario)}`
  }

  function escenarioPorId(id) {
    return escenarios.value.find(e => e.id === id) || null
  }

  return {
    escenarios,
    cargarEscenarios,
    etiquetaEscenario,
    abrevPeriodo,
    adjetivoPeriodo,
    escenarioPorId
  }
}
