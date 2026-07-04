<template>
  <div class="p-3 bg-light shadow-sm">
    <h6 class="text fw-bold border-bottom pb-1 mb-2">Ultimos 10 Movimientos</h6>
    <div v-if="cargandoHistorial" class="text-center text-muted small py-2">Cargando...</div>
    <ul v-else class="list-group list-group-flush small">
      <li v-for="log in historialFiltrado" :key="log.id" class="list-group-item bg-transparent px-0 d-flex justify-content-between align-items-center border-bottom border-light">
        <div><strong class="text-dark">{{ formatearFecha(log.fecha) }}</strong><br><span class="text-muted" style="font-size: 0.85rem;">💰 Abono ({{ log.metodoPago === 'TRANSFERENCIA' ? 'Transf.' : 'Efectivo' }})</span></div>
        <div class="d-flex align-items-center gap-2"><span class="fw-semibold" style="color: var(--text-primary);">+${{ formatearDinero(log.monto) }}</span><button v-if="esAdmin" @click="eliminarAbono(log)" class="app-btn app-btn--ghost app-btn--sm" style="padding: 2px 6px; color: var(--color-danger);">🗑️</button></div>
      </li>
      <li v-if="historialFiltrado.length === 0" class="list-group-item bg-transparent text-muted text-center px-0">No hay movimientos registrados.</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { formatearFecha, formatearDinero } from '@/utils/formatters';

const esAdmin = localStorage.getItem('authRole') === 'ADMIN';
const props = defineProps({ parentId: { type: Number, required: true } });
const emit = defineEmits(['recargar']);

const historialPadre = ref([]);
const cargandoHistorial = ref(false);

const historialFiltrado = computed(() => historialPadre.value.filter(log => log.tipoMovimiento === 'INGRESO_ABONO'));

const cargarHistorialCompleto = async () => {
  cargandoHistorial.value = true;
  try {
    const r = await axios.get('/api/finanzas/historial/' + props.parentId);
    historialPadre.value = r.data;
  } catch (e) {
    console.error("Error:", e);
  } finally {
    cargandoHistorial.value = false;
  }
};

const eliminarAbono = async (log) => {
  if (!confirm('¿Eliminar abono de $' + formatearDinero(log.monto) + '?')) return;
  try {
    await axios.delete('/api/finanzas/abono/' + log.id);
    alert('✅ Eliminado.');
    emit('recargar');
    cargarHistorialCompleto();
  } catch (e) {
    console.error(e);
    alert('❌ Error.');
  }
};

cargarHistorialCompleto();
</script>
