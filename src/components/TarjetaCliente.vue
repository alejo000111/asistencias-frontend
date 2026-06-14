<template>
  <div class="card shadow-sm" :class="[padre.estado === 'INACTIVO' ? 'border-secondary bg-light' : (padre.deudaTotal > 0 ? 'border-danger' : 'border-success'), 'tarjeta-cliente']">
    <div class="card-header text-white d-flex justify-content-between align-items-center" :class="padre.estado === 'INACTIVO' ? 'bg-secondary' : 'bg-dark'">
      <h5 class="mb-0">{{ padre.nombreCompleto }}
        <button @click="copiarLink" class="btn btn-sm btn-primary fw-bold shadow-sm ms-2 py-1 px-2" style="font-size: 0.80rem;">🔗 Copiar Link</button>
      </h5>
      <div class="d-flex align-items-center gap-1">
        <span v-if="padre.deudaTotal > 0" class="badge bg-danger fs-6 me-1 shadow-sm">Debe: ${{ formatearDinero(padre.deudaTotal) }}</span>
        <span v-if="padre.saldoAbono > 0" class="badge bg-success fs-6 shadow-sm">Abono: ${{ formatearDinero(padre.saldoAbono) }}</span>
      </div>
    </div>
    <div class="card-body p-0">
      <div class="p-3" v-if="activeFormType !== 'edit'">
        <p class="mb-2 text-dark"><strong>📞 Telefono:</strong> {{ padre.telefono }}</p>
        <ul class="list-group list-group-flush mb-3 small">
          <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 border-0 pt-1 pb-1" v-for="hijo in padre.students" :key="hijo.id">
            <span>
              🛼 {{ hijo.nombreCompleto }} <span class="text-muted">({{ hijo.edad || 'N/A' }} años)</span>
              <span class="text-muted small d-block" style="font-size: 0.7rem; line-height: 1.2;">🏢 {{ formatearMatriculas(hijo.matriculas) || 'Sin matricula' }}</span>
            </span>
          </li>
        </ul>
        <hr class="text-muted my-2">
        <div class="d-flex gap-2 mt-3">
          <button @click="$emit('toggleCardForm', { clientId: padre.id, formType: 'abono' }); $emit('toggleDeudas', null)" class="btn btn-sm btn-success w-100 fw-bold shadow-sm" :disabled="padre.estado === 'INACTIVO'">💰 Abono</button>
          <button @click="toggleHistorial(); $emit('toggleDeudas', null)" class="btn btn-sm w-100 text-white fw-bold shadow-sm" style="background-color: #374151;">📄 Historial</button>
          <button @click="activarModoEdicion(); $emit('toggleDeudas', null)" class="btn btn-sm w-100 text-white fw-bold shadow-sm" style="background-color: #475569;">⚙️ Editar</button>
        </div>
        <div v-if="padre.deudaTotal > 0" class="mt-3 border-top pt-3">
          <button @click="toggleDeudas(); $emit('toggleCardForm', { clientId: padre.id, formType: null })" class="btn btn-sm w-100 fw-bold shadow-sm transition" :style="{ backgroundColor: mostrarDeudas ? '#991b1b' : '#e63946', color: 'white' }">💸 Clases por Pagar</button>
          <div v-if="mostrarDeudas" class="mt-2 p-2 rounded small shadow-sm" style="background-color: #fffbfa; border: 1px solid #e63946;">
            <ul class="list-group list-group-flush">
              <li v-for="deuda in listaDeudas" :key="deuda.id" class="list-group-item px-1 py-1 text-muted border-bottom d-flex justify-content-between align-items-center" style="background-color: transparent;">
                <div><span class="text-dark fw-bold">• {{ deuda.student.nombreCompleto }}</span><br><small class="fw-bold text-muted">{{ formatearFecha(deuda.fecha) }}</small></div>
                <span class="badge bg-dark fs-6 shadow-sm">${{ formatearDinero(deuda.precioCobrado) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div v-show="activeFormType" class="border-top panel-desplegable">
        <AbonoForm v-if="activeFormType === 'abono'" :padre="padre" @recargar="$emit('recargar')" @cerrar="$emit('toggleCardForm', { clientId: padre.id, formType: null })" />
        <HistorialForm v-if="activeFormType === 'historial'" :parent-id="padre.id" @recargar="$emit('recargar')" />
        <EditForm v-if="activeFormType === 'edit'" :padre="padre" :sedes="sedes" @recargar="$emit('recargar')" @cancelar="cancelarEdicion" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { formatearFecha, formatearDinero } from '@/utils/formatters';
import AbonoForm from './AbonoForm.vue';
import HistorialForm from './HistorialForm.vue';
import EditForm from './EditForm.vue';

const esAdmin = localStorage.getItem('authRole') === 'ADMIN';
const props = defineProps(['padre', 'activeFormType', 'activeDeudasId']);
const emit = defineEmits(['toggleCardForm', 'toggleDeudas', 'clienteActualizado', 'recargar']);

const sedes = ref([]);
const listaDeudas = ref([]);

const formatearMatriculas = (matriculas) => {
  if (!matriculas || matriculas.length === 0) return '';
  return matriculas.map(m => (m.sede?.nombre || '?') + ' (' + m.nivel + ')').join(' | ');
};

const cargarSedes = async () => {
  try { const res = await axios.get('/api/sedes'); sedes.value = res.data; }
  catch (e) { console.error('Error al cargar sedes:', e); }
};

const mostrarDeudas = computed(() => props.activeDeudasId === props.padre.id);

const toggleDeudas = async () => {
  emit('toggleDeudas', props.padre.id);
  if (!mostrarDeudas.value) {
    try { const r = await axios.get('/api/finanzas/deudas/' + props.padre.id); listaDeudas.value = r.data; }
    catch (e) { console.error("Error:", e); }
  }
};

const toggleHistorial = () => emit('toggleCardForm', { clientId: props.padre.id, formType: 'historial' });

const activarModoEdicion = () => {
  cargarSedes();
  props.padre.editNombre = props.padre.nombreCompleto;
  props.padre.editTelefono = props.padre.telefono;
  props.padre.editEstado = props.padre.estado || 'ACTIVO';
  if (props.padre.students) {
    props.padre.students.forEach(hijo => {
      hijo.editNombre = hijo.nombreCompleto;
      hijo.editEdad = hijo.edad;
      hijo.editFechaNacimiento = hijo.fechaNacimiento;
      const mats = hijo.matriculas || [];
      hijo.editSedeIds = mats.map(m => m.sede?.id).filter(id => id != null);
      hijo.editNiveles = {};
      mats.forEach(m => { if (m.sede?.id) hijo.editNiveles[m.sede.id] = m.nivel; });
    });
  }
  emit('toggleCardForm', { clientId: props.padre.id, formType: 'edit' });
};

const cancelarEdicion = () => emit('toggleCardForm', { clientId: props.padre.id, formType: 'edit' });

const copiarLink = async () => {
  const url = window.location.origin + '/portal/' + props.padre.secretToken;
  try { await navigator.clipboard.writeText(url); alert('✅ Enlace copiado'); }
  catch { const ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); alert('✅ Enlace copiado'); }
};
</script>

<style scoped>
.tarjeta-cliente { transition: all 0.2s ease-out; }
.tarjeta-cliente.border-primary { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important; }
.panel-desplegable { overflow: hidden; transition: height 0.2s ease-out; }
.panel-edicion { border-top: 2px solid var(--bs-primary); }
</style>
