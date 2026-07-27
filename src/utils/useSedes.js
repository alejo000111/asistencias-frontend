import { ref, computed } from 'vue'
import axios from 'axios'

// Estado reactivo global compartido (Singleton)
const sedes = ref([])
const sedesCargadas = ref(false)
const loading = ref(false)

/**
 * Composable centralizado para cargar y gestionar sedes.
 * Reemplaza las funciones cargarSedes() duplicadas en 7 vistas.
 */
export function useSedes() {
  const cargarSedes = async (force = false) => {
    if (loading.value) return
    if (sedesCargadas.value && sedes.value.length > 0 && !force) return
    loading.value = true
    try {
      const res = await axios.get('/api/sedes')
      sedes.value = res.data || []
    } catch (e) {
      console.error('Error al cargar sedes:', e)
    } finally {
      sedesCargadas.value = true
      loading.value = false
    }
  }

  const sedesActivas = computed(() =>
    sedes.value.filter(s => s.activa !== false)
  )

  const sedesBloqueadas = computed(() =>
    sedes.value.length > 0 && sedes.value.every(s => s.activa === false)
  )

  return {
    sedes,
    sedesCargadas,
    loading,
    cargarSedes,
    sedesActivas,
    sedesBloqueadas
  }
}
