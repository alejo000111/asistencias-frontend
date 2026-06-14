<template>
  <div class="tarjeta-cliente card-premium" :class="{ 'opacity-50': padre.estado === 'INACTIVO' }">
    <div class="tarjeta-cliente__header">
      <h5 class="tarjeta-cliente__title">{{ padre.nombreCompleto }}
        <button @click="copiarLink" class="app-btn app-btn--ghost app-btn--sm" style="font-size: 0.75rem;">🔗 Copiar Link</button>
      </h5>
      <div class="tarjeta-cliente__badges">
        <span v-if="padre.deudaTotal > 0" class="badge-premium" style="background: var(--gray-200); color: var(--gray-800); font-weight: 600;">
          Debe: ${{ formatearDinero(padre.deudaTotal) }}
        </span>
        <span v-if="padre.saldoAbono > 0" class="badge-premium" style="background: var(--gray-200); color: var(--gray-800);">
          Abono: ${{ formatearDinero(padre.saldoAbono) }}
        </span>
      </div>
    </div>
    <div class="tarjeta-cliente__body" v-if="activeFormType !== 'edit'">
      <p class="tarjeta-cliente__info"><strong>📞 Teléfono:</strong> {{ padre.telefono }}</p>
      <ul class="tarjeta-cliente__students">
        <li v-for="hijo in padre.students" :key="hijo.id" class="tarjeta-cliente__student">
          <span>
            🛼 {{ hijo.nombreCompleto }} <span class="text-secondary">({{ hijo.edad || 'N/A' }} años)</span>
            <span class="tarjeta-cliente__matricula">{{ formatearMatriculas(hijo.matriculas) || 'Sin matrícula' }}</span>
          </span>
        </li>
      </ul>
      <hr class="tarjeta-cliente__divider">
      <div class="tarjeta-cliente__actions">
        <button @click="$emit('toggleCardForm', { clientId: padre.id, formType: 'abono' }); $emit('toggleDeudas', null)"
                class="app-btn app-btn--outline app-btn--sm" style="flex:1"
                :disabled="padre.estado === 'INACTIVO'">💰 Abono</button>
        <button @click="toggleHistorial(); $emit('toggleDeudas', null)"
                class="app-btn app-btn--ghost app-btn--sm" style="flex:1">📄 Historial</button>
        <button @click="activarModoEdicion(); $emit('toggleDeudas', null)"
                class="app-btn app-btn--ghost app-btn--sm" style="flex:1">⚙️ Editar</button>
      </div>
      <div v-if="padre.deudaTotal > 0" class="tarjeta-cliente__deudas">
        <button @click="toggleDeudas(); $emit('toggleCardForm', { clientId: padre.id, formType: null })"
                class="app-btn app-btn--outline app-btn--sm" style="width:100%">
          {{ mostrarDeudas ? '⬆ Ocultar' : '💸 Clases por Pagar' }}
        </button>
        <div v-if="mostrarDeudas" class="tarjeta-cliente__deudas-list">
          <ul>
            <li v-for="deuda in listaDeudas" :key="deuda.id" class="tarjeta-cliente__deuda-item">
              <div>
                <span class="fw-semibold">• {{ deuda.student.nombreCompleto }}</span>
                <br><small class="text-muted">{{ formatearFecha(deuda.fecha) }}</small>
              </div>
              <span class="badge-premium" style="background: var(--gray-200); color: var(--gray-800);">${{ formatearDinero(deuda.precioCobrado) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-show="activeFormType" class="tarjeta-cliente__panel">
      <AbonoForm v-if="activeFormType === 'abono'" :padre="padre" @recargar="$emit('recargar')" @cerrar="$emit('toggleCardForm', { clientId: padre.id, formType: null })" />
      <HistorialForm v-if="activeFormType === 'historial'" :parent-id="padre.id" @recargar="$emit('recargar')" />
      <EditForm v-if="activeFormType === 'edit'" :padre="padre" :sedes="sedes" @recargar="$emit('recargar')" @cancelar="cancelarEdicion" />
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
.tarjeta-cliente {
  transition: box-shadow var(--transition-normal);
}

.tarjeta-cliente:hover {
  box-shadow: var(--shadow-md);
}

.tarjeta-cliente.opacity-50 {
  opacity: 0.5;
}

.tarjeta-cliente__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-primary);
}

.tarjeta-cliente__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.tarjeta-cliente__badges {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.tarjeta-cliente__body {
  padding: var(--space-3) var(--space-4);
}

.tarjeta-cliente__info {
  margin-bottom: var(--space-3);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.tarjeta-cliente__students {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-3) 0;
}

.tarjeta-cliente__student {
  padding: var(--space-1) 0;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.tarjeta-cliente__matricula {
  display: block;
  font-size: 0.7rem;
  line-height: 1.2;
  color: var(--text-tertiary);
}

.tarjeta-cliente__divider {
  border: none;
  border-top: 1px solid var(--border-primary);
  margin: var(--space-3) 0;
}

.tarjeta-cliente__actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.tarjeta-cliente__deudas {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-primary);
}

.tarjeta-cliente__deudas-list {
  margin-top: var(--space-2);
  padding: var(--space-2);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
}

.tarjeta-cliente__deudas-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tarjeta-cliente__deuda-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-1) 0;
  border-bottom: 1px solid var(--border-primary);
  font-size: 0.8125rem;
}

.tarjeta-cliente__deuda-item:last-child {
  border-bottom: none;
}

.tarjeta-cliente__panel {
  border-top: 1px solid var(--border-primary);
  overflow: hidden;
}

/* Responsive: acciones en columna en mobile */
@media (max-width: 768px) {
  .tarjeta-cliente__header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .tarjeta-cliente__badges {
    align-self: flex-start;
    flex-wrap: wrap;
  }

  .tarjeta-cliente__actions {
    flex-direction: column;
  }

  .tarjeta-cliente__actions .app-btn {
    width: 100%;
  }

  .tarjeta-cliente__body {
    padding: var(--space-3);
  }

  .tarjeta-cliente__title {
    font-size: 0.9375rem;
  }
}
</style>
