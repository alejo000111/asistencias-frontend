<template>
  <div class="p-3 bg-white shadow-sm">
    <!-- Banner de "Deshacer" tras registrar un abono o pagar un plan — por si se registró mal
         (monto equivocado, deportista equivocado, etc). Se queda visible hasta que se cierre el
         panel o se registre otro pago. -->
    <div v-if="ultimoAbono" class="alert alert-success d-flex justify-content-between align-items-center py-2 px-3 mb-3">
      <div class="small">
        <strong>✅ {{ ultimoAbono.descripcion }}</strong>
      </div>
      <button type="button" class="btn btn-sm btn-outline-danger fw-bold flex-shrink-0 ms-2" :disabled="deshaciendo" @click="deshacerUltimoAbono">
        {{ deshaciendo ? '⏳...' : '↩️ Deshacer' }}
      </button>
    </div>

    <!-- Pagar el plan de mensualidad asignado (precio vigente hoy, según el calendario
         preferencial/estándar/mora que ya tiene configurado el club) — alternativa a escribir
         un monto libre cuando lo que se está cobrando es simplemente la mensualidad del plan. -->
    <div v-if="planesDisponibles.length > 0" class="mb-3">
      <label class="form-label text-sm mb-1 fw-bold text-dark">💳 Pagar Plan Asignado:</label>
      <div v-for="p in planesDisponibles" :key="p.studentId" class="d-flex justify-content-between align-items-center border rounded p-2 mb-1">
        <div class="me-2">
          <div class="fw-semibold small text-dark">{{ p.nombreDeportista }}</div>
          <div class="text-muted" style="font-size: 0.75rem;">{{ p.sede }} — {{ p.plan }}</div>
        </div>
        <button type="button" class="btn btn-sm btn-outline-primary flex-shrink-0" :disabled="procesandoPago" @click="pagarPlan(p)">
          Pagar ${{ formatearMontoInput(p.monto) }}
        </button>
      </div>
      <hr class="my-2">
    </div>

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
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { formatearMontoInput, actualizarMontoInput } from '@/utils/formatters';

const props = defineProps({ padre: { type: Object, required: true } });
const emit = defineEmits(['recargar', 'cerrar', 'notificar']);

const procesandoPago = ref(false);
const planesDisponibles = ref([]);
const ultimoAbono = ref(null); // { id, descripcion } del último abono/pago registrado en este panel
const deshaciendo = ref(false);

// Precio vigente HOY del plan de cada deportista (respeta el calendario preferencial/estándar/
// mora del club) — se calcula en el backend para no duplicar esa lógica de negocio aquí.
const cargarPlanesDisponibles = async () => {
  const estudiantes = props.padre.students || [];
  const resultados = await Promise.all(estudiantes.map(async (est) => {
    try {
      const res = await axios.get(`/api/finanzas/deportista/${est.id}/precio-plan`);
      return res.data;
    } catch (e) {
      return null; // deportista sin sede principal/plan asignado — no se ofrece el botón
    }
  }));
  planesDisponibles.value = resultados.filter(Boolean);
};

onMounted(cargarPlanesDisponibles);

const pagarPlan = async (plan) => {
  procesandoPago.value = true;
  try {
    const res = await axios.post('/api/finanzas/abono', null, {
      params: {
        parentId: props.padre.id,
        monto: plan.monto,
        metodoPago: props.padre.metodoPago || 'EFECTIVO',
        fecha: props.padre.fechaAbono
      }
    });
    ultimoAbono.value = { id: res.data?.abonoId, descripcion: `Se registró el pago del plan de ${plan.nombreDeportista} ($${formatearMontoInput(plan.monto)}).` };
    emit('notificar', { tipo: 'success', titulo: 'Plan Pagado', mensaje: `Se registró el pago del plan de ${plan.nombreDeportista}.` });
    emit('recargar');
  } catch (e) {
    console.error(e);
    const msg = e.response?.data?.mensaje || e.response?.data?.error || 'Hubo un problema al registrar el pago.';
    emit('notificar', { tipo: 'danger', titulo: 'Error al Registrar', mensaje: msg });
  } finally {
    procesandoPago.value = false;
  }
};

const enviarAbono = async () => {
  if (!props.padre.nuevoAbono || props.padre.nuevoAbono <= 0) {
    emit('notificar', { tipo: 'warning', titulo: 'Monto Inválido', mensaje: 'Por favor ingresa un monto mayor a cero.' });
    return;
  }
  procesandoPago.value = true;
  try {
    const res = await axios.post('/api/finanzas/abono', null, {
      params: { parentId: props.padre.id, monto: props.padre.nuevoAbono, metodoPago: props.padre.metodoPago, fecha: props.padre.fechaAbono }
    });
    ultimoAbono.value = { id: res.data?.abonoId, descripcion: `Se registró un abono de $${formatearMontoInput(props.padre.nuevoAbono)}.` };
    emit('notificar', { tipo: 'success', titulo: 'Abono Registrado', mensaje: 'El abono se registró y se aplicó FIFO correctamente.' });
    props.padre.nuevoAbono = '';
    emit('recargar');
  } catch (e) {
    console.error(e);
    const msg = e.response?.data?.mensaje || e.response?.data?.error || 'Hubo un problema al registrar el abono.';
    const titulo = e.response?.data?.error ? 'Operación no permitida' : 'Error al Registrar';
    emit('notificar', { tipo: 'danger', titulo, mensaje: msg });
  } finally {
    procesandoPago.value = false;
  }
};

const deshacerUltimoAbono = async () => {
  if (!ultimoAbono.value?.id) {
    emit('notificar', { tipo: 'warning', titulo: 'No se puede deshacer', mensaje: 'Este pago no tiene un ID para revertir — revísalo manualmente en el Historial.' });
    return;
  }
  if (!confirm('¿Deshacer este pago? Las deudas que haya cubierto volverán a quedar pendientes.')) return;
  deshaciendo.value = true;
  try {
    await axios.delete(`/api/finanzas/abono/${ultimoAbono.value.id}`);
    emit('notificar', { tipo: 'success', titulo: 'Pago Deshecho', mensaje: 'El pago se revirtió y las deudas que cubría volvieron a quedar pendientes.' });
    ultimoAbono.value = null;
    emit('recargar');
    await cargarPlanesDisponibles();
  } catch (e) {
    console.error(e);
    const msg = e.response?.data?.mensaje || e.response?.data?.error || (typeof e.response?.data === 'string' ? e.response?.data : null) || 'No se pudo deshacer el pago.';
    emit('notificar', { tipo: 'danger', titulo: 'Error al Deshacer', mensaje: msg });
  } finally {
    deshaciendo.value = false;
  }
};
</script>
