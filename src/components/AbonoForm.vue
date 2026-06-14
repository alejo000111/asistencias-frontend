<template>
  <div class="p-3 bg-white shadow-sm">
    <label class="form-label text-sm mb-1 fw-bold text-dark">Monto a abonar:</label>
    <input type="text" inputmode="numeric" :value="formatearMontoInput(padre.nuevoAbono)" @input="actualizarMontoInput($event, padre, 'nuevoAbono', '')" class="form-control form-control-sm mb-2" placeholder="Ej: 50.000" />
    <div class="row">
      <div class="col-6">
        <label class="form-label text-sm mb-1 fw-bold text-dark">Metodo:</label>
        <select v-model="padre.metodoPago" class="form-select form-select-sm mb-3">
          <option value="EFECTIVO">Efectivo</option>
          <option value="TRANSFERENCIA">Transferencia</option>
        </select>
      </div>
      <div class="col-6">
        <label class="form-label text-sm mb-1 fw-bold text-dark">Fecha de pago:</label>
        <input type="date" v-model="padre.fechaAbono" class="form-control form-control-sm mb-3" />
      </div>
    </div>
    <button @click="enviarAbono" :disabled="procesandoPago" class="btn btn-sm btn-success w-100 fw-bold shadow-sm">{{ procesandoPago ? '⏳ Procesando...' : 'Confirmar Pago' }}</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { formatearMontoInput, actualizarMontoInput } from '@/utils/formatters';

const props = defineProps({ padre: { type: Object, required: true } });
const emit = defineEmits(['recargar', 'cerrar']);

const procesandoPago = ref(false);

const enviarAbono = async () => {
  if (!props.padre.nuevoAbono || props.padre.nuevoAbono <= 0) return alert("⚠️ Monto invalido.");
  procesandoPago.value = true;
  try {
    await axios.post('/api/finanzas/abono', null, {
      params: { parentId: props.padre.id, monto: props.padre.nuevoAbono, metodoPago: props.padre.metodoPago, fecha: props.padre.fechaAbono }
    });
    alert('✅ Abono registrado.');
    emit('recargar');
    emit('cerrar');
  } catch (e) {
    console.error(e);
    alert("❌ Error.");
  } finally {
    procesandoPago.value = false;
  }
};
</script>
