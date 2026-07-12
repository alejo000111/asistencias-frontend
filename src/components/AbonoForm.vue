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
    <button @click="enviarAbono" :disabled="procesandoPago" class="app-btn app-btn--primary app-btn--sm" style="width:100%">{{ procesandoPago ? '⏳ Procesando...' : 'Confirmar Pago' }}</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { formatearMontoInput, actualizarMontoInput } from '@/utils/formatters';

const props = defineProps({ padre: { type: Object, required: true } });
const emit = defineEmits(['recargar', 'cerrar', 'notificar']);

const procesandoPago = ref(false);

const enviarAbono = async () => {
  if (!props.padre.nuevoAbono || props.padre.nuevoAbono <= 0) {
    emit('notificar', { tipo: 'warning', titulo: 'Monto Inválido', mensaje: 'Por favor ingresa un monto mayor a cero.' });
    return;
  }
  procesandoPago.value = true;
  try {
    await axios.post('/api/finanzas/abono', null, {
      params: { parentId: props.padre.id, monto: props.padre.nuevoAbono, metodoPago: props.padre.metodoPago, fecha: props.padre.fechaAbono }
    });
    emit('notificar', { tipo: 'success', titulo: 'Abono Registrado', mensaje: 'El abono se registró y se aplicó FIFO correctamente.' });
    emit('recargar');
    emit('cerrar');
  } catch (e) {
    console.error(e);
    emit('notificar', { tipo: 'danger', titulo: 'Error al Registrar', mensaje: 'Hubo un problema al registrar el abono.' });
  } finally {
    procesandoPago.value = false;
  }
};
</script>
