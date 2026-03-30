<template>
  <div class="mt-4">
    <h3 class="mb-4">📊 Historial de Caja</h3>

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
                <td class="fw-bold">{{ log.parent ? log.parent.nombreCompleto : 'Desconocido' }}</td>
                
                <td>
                  <span v-if="log.tipoMovimiento === 'INGRESO_ABONO'" class="badge bg-success fs-6">
                    💰 Abono
                  </span>
                  <span v-else-if="log.tipoMovimiento === 'USO_ABONO_CLASE'" class="badge bg-primary fs-6">
                     🛼 Pago de Clase
                  </span>
                </td>
                
                <td>
                  <span v-if="log.metodoPago === 'EFECTIVO'">💵 Efectivo</span>
                  <span v-else-if="log.metodoPago === 'TRANSFERENCIA'">📱 Transferencia</span>
                  <span v-else>🔄 Descuento Automático</span>
                </td>
                
                <td class="text-end pe-4 fw-bold fs-5" :class="log.tipoMovimiento === 'INGRESO_ABONO' ? 'text-success' : 'text-primary'">
                  {{ log.tipoMovimiento === 'INGRESO_ABONO' ? '+' : '' }}${{ log.monto }}
                </td>
              </tr>
              <tr v-if="historial.length === 0">
                <td colspan="5" class="text-center text-muted py-5">
                  No hay movimientos registrados en la caja aún.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-footer d-flex justify-content-between align-items-center bg-light" v-if="totalPages > 1">
        <span class="text-muted small">
          Mostrando página <strong>{{ paginaActual }}</strong> de <strong>{{ totalPages }}</strong>
          (Total: {{ historial.length }} registros)
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
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const historial = ref([]);

// --- VARIABLES DE PAGINACIÓN ---
const paginaActual = ref(1);
const registrosPorPagina = 10; // Cambia este número si quieres ver más o menos filas

// Calcula el total de páginas necesarias
const totalPages = computed(() => {
  return Math.ceil(historial.value.length / registrosPorPagina) || 1;
});

const paginatedHistorial = computed(() => {
  const inicio = (paginaActual.value - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  return historial.value.slice(inicio, fin);
});

const formatearFecha = (fechaDato) => {
  if (!fechaDato) return '';
  if (Array.isArray(fechaDato)) {
    const dia = String(fechaDato[2]).padStart(2, '0');
    const mes = String(fechaDato[1]).padStart(2, '0');
    const anio = fechaDato[0];
    return `${dia}/${mes}/${anio}`;
  }
  const fecha = new Date(fechaDato);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

const cargarHistorial = async () => {
  try {
    const response = await axios.get('/api/finanzas/historial');
    historial.value = response.data.sort((a, b) => b.id - a.id);
    paginaActual.value = 1; // Reseteamos a la página 1 al cargar nuevos datos
  } catch (error) {
    console.error("Error cargando el historial:", error);
  }
};

onMounted(() => {
  cargarHistorial();
});
</script>