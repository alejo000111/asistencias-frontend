<template>
  <div>
    <h3 class="mb-4 mt-0">📊 Historial de Caja</h3>

    <!-- Barra de búsqueda en vivo -->
    <div class="mb-3">
      <input
        type="text"
        v-model="textoBusqueda"
        class="form-control shadow-sm border-secondary"
        placeholder="🔍 Buscar por nombre del padre..."
      />
    </div>

    <div class="card shadow-sm border-dark">
      <div class="card-header bg-dark text-white">
        <h5 class="mb-0">Movimientos Registrados</h5>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover table-striped mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th>Fecha</th>
                <th>Cliente (Padre)</th>
                <th>Tipo de Movimiento</th>
                <th>Método</th>
                <th class="text-end pe-4">Monto ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in paginatedHistorial" :key="log.id">
                <td class="fw-bold text-secondary">{{ formatearFecha(log.fecha) }}</td>
                <td class="fw-bold">{{ log.parent ? log.parent.nombreCompleto : (log.nombreClienteRespaldo || 'Desconocido') }}</td>
                
                <td>
                  <span class="badge bg-success fs-6">💰 Abono</span>
                </td>
                
                <td>
                  <span v-if="log.metodoPago === 'EFECTIVO'">💵 Efectivo</span>
                  <span v-else-if="log.metodoPago === 'TRANSFERENCIA'">📱 Transferencia</span>
                  <span v-else>🔄 Descuento Automático</span>
                </td>
                
                <td class="text-end pe-4 fw-bold fs-5 text-success">
                  +${{ log.monto }}
                </td>
              </tr>
              <tr v-if="historialIngresos.length === 0">
                <td colspan="5" class="text-center text-muted py-5">
                  No hay ingresos registrados en la caja aún.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-footer d-flex justify-content-between align-items-center bg-light" v-if="totalPages > 1">
        <span class="text-muted small">
          Mostrando página <strong>{{ paginaActual }}</strong> de <strong>{{ totalPages }}</strong>
          (Total: {{ historialIngresos.length }} registros)
        </span>
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" :class="{ disabled: paginaActual === 1 }">
            <button class="page-link" @click="paginaActual--">Anterior</button>
          </li>
          <li class="page-item" v-for="pagina in totalPages" :key="pagina" :class="{ active: paginaActual === pagina }">
            <button class="page-link" @click="paginaActual = pagina">{{ pagina }}</button>
          </li>
          <li class="page-item" :class="{ disabled: paginaActual === totalPages }">
            <button class="page-link" @click="paginaActual++">Siguiente</button>
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';
import { formatearFecha } from '@/utils/formatters';

const historial = ref([]);
const textoBusqueda = ref('');

// --- RESETEA PÁGINA AL BUSCAR ---
watch(textoBusqueda, () => {
  paginaActual.value = 1;
});

// --- FILTRO: Solo ingresos reales de dinero (excluye USO_ABONO_CLASE) ---
const historialIngresos = computed(() => {
  return historial.value.filter(log => log.tipoMovimiento === 'INGRESO_ABONO');
});

// --- FILTRO DE BÚSQUEDA EN VIVO (sobre los ingresos reales) ---
const historialFiltrado = computed(() => {
  const busqueda = textoBusqueda.value.toLowerCase().trim();
  if (!busqueda) return historialIngresos.value;
  return historialIngresos.value.filter(log => {
    const nombre = log.parent ? log.parent.nombreCompleto.toLowerCase() : (log.nombreClienteRespaldo || '').toLowerCase();
    return nombre.includes(busqueda);
  });
});

// --- VARIABLES DE PAGINACIÓN ---
const paginaActual = ref(1);
const registrosPorPagina = 10; // Cambia este número si quieres ver más o menos filas

// Calcula el total de páginas necesarias (sobre la lista filtrada)
const totalPages = computed(() => {
  return Math.ceil(historialFiltrado.value.length / registrosPorPagina) || 1;
});

const paginatedHistorial = computed(() => {
  const inicio = (paginaActual.value - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  return historialFiltrado.value.slice(inicio, fin);
});

const cargarHistorial = async () => {
  try {
    const response = await axios.get('/api/finanzas/historial');
    historial.value = response.data.sort((a, b) => b.id - a.id);
    textoBusqueda.value = ''; // Limpiamos la búsqueda al recargar
    paginaActual.value = 1; // Reseteamos a la página 1 al cargar nuevos datos
  } catch (error) {
    console.error("Error cargando el historial:", error);
  }
};

onMounted(() => {
  cargarHistorial();
});
</script>