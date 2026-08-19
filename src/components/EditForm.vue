<template>
  <div class="bg-white p-3 shadow-sm panel-edicion">
    <div class="d-flex justify-content-between align-items-center border-bottom pb-1 mb-2">
      <h6 class="text-secondary fw-bold mb-0">Editar Padre / Acudiente</h6>
      <button v-if="esAdmin && padre.estado === 'INACTIVO'" @click="eliminarPadre" class="btn btn-sm btn-outline-danger py-0 px-2 fw-bold">🗑️ Eliminar Definitivamente</button>
    </div>
    <input type="text" v-model="padre.editNombre" class="form-control form-control-sm mb-2" placeholder="Nombre Completo">
    <input type="text" v-model="padre.editTelefono" class="form-control form-control-sm mb-2" placeholder="Telefono">
    <select v-if="!esCortesia" v-model="padre.editEstado" class="form-select form-select-sm mb-4 fw-bold" style="background: var(--input-bg); border-color: var(--input-border);">
      <option value="ACTIVO">🟢 ACTIVO</option>
      <option value="INACTIVO">🔴 INACTIVO</option>
    </select>

    <div class="d-flex justify-content-between align-items-center border-bottom pb-1 mb-2 mt-3">
      <h6 class="text-secondary fw-bold mb-0">Deportistas</h6>
      <button @click="agregarDeportistaLocal" class="btn btn-sm btn-outline-primary py-0 px-2 fw-bold" :disabled="limiteAlcanzado">+ Agregar Deportista</button>
    </div>
    <div v-if="limiteAlcanzado" class="alert alert-danger fw-bold text-center mt-2 mb-2 p-2 small">
      ⚠️ Límite del plan alcanzado. No puedes agregar más deportistas.
    </div>

    <div v-for="(hijo, idx) in padre.students" :key="hijo.id || ('nuevo-' + idx)" class="mb-3 border-start border-3 ps-2 position-relative" style="border-color: #cbd5e1 !important;">
      <div class="d-flex gap-2 mb-1">
        <input type="text" v-model="hijo.editNombre" class="form-control form-control-sm" placeholder="Nombre del Deportista">
        <button v-if="hijo.id && esAdmin && padre.estado === 'INACTIVO'" @click="eliminarDeportista(hijo.id, hijo.editNombre)" class="app-btn app-btn--danger app-btn--sm" style="padding: 2px 8px;">🗑️</button>
        <button v-if="!hijo.id" @click="quitarDeportistaNuevo(idx)" class="app-btn app-btn--secondary app-btn--sm" style="padding: 2px 8px;">❌</button>
      </div>
      <div class="d-flex gap-1 mt-1">
        <input type="date" v-model="hijo.editFechaNacimiento" @change="calcularEdad(hijo)" class="form-control form-control-sm w-50">
        <input type="number" v-model="hijo.editEdad" class="form-control form-control-sm w-25 bg-light text-secondary fw-bold text-center" readonly title="Edad calculada">
      </div>
      <div class="mt-2">
        <div class="fw-bold small text-secondary mb-1">Sedes / Grupos:</div>
        <div v-for="s in sedesOrdenadas(hijo)" :key="s.id" class="mb-2 border-bottom pb-1">
          <div class="form-check">
            <input type="checkbox" :id="'chk-' + idx + '-' + s.id" :value="s.id" v-model="hijo.editSedeIds" class="form-check-input" @change="sincronizarMatricula(hijo, s.id)">
            <label :for="'chk-' + idx + '-' + s.id" class="form-check-label fw-bold small">{{ s.nombre }}</label>
          </div>
          <div v-if="hijo.editSedeIds && hijo.editSedeIds.length > 1 && hijo.editSedeIds.includes(s.id)" class="form-check mt-1">
            <input type="radio" :id="'chk-principal-' + idx + '-' + s.id" :name="'sede-principal-' + idx" :value="s.id" v-model="hijo.editSedePrincipalId" class="form-check-input">
            <label :for="'chk-principal-' + idx + '-' + s.id" class="form-check-label small text-warning-emphasis">⭐ Sede principal (desde aquí se cobra la mensualidad)</label>
          </div>
          <select v-if="hijo.editSedeIds && hijo.editSedeIds.includes(s.id)" v-model="hijo.editNiveles[s.id]" class="form-select form-select-sm mt-1 fw-bold" style="max-width: 240px;">
            <option value="" disabled>Selecciona grupo...</option>
            <template v-for="g in (s.grupos || [])" :key="g.nombre">
              <option v-if="g && g.nombre && g.nombre.trim() !== ''" :value="(g.emoji ? (g.emoji + ' ') : '') + g.nombre">
                {{ g.emoji ? g.emoji + ' ' : '' }}{{ g.nombre }}
              </option>
            </template>
          </select>

          <!-- Plan de mensualidad de esta sede (catálogo propio por sede) -->
          <select
            v-if="clubConfig?.preciosDiferenciados && hijo.editSedeIds && hijo.editSedeIds.includes(s.id) && (planesPorSede[s.id] || []).length > 0"
            v-model="hijo.editPlanPorSede[s.id]"
            class="form-select form-select-sm mt-1"
            style="max-width: 240px;"
          >
            <option :value="null" disabled>Selecciona un plan (Requerido)</option>
            <option v-for="p in planesPorSede[s.id]" :key="p.id" :value="p.id">
              📋 {{ p.nombre }}
            </option>
          </select>
        </div>

        <!-- Plan Global (cuando los precios son unificados) -->
        <div v-if="!clubConfig?.preciosDiferenciados && (planesPorSede['global'] || []).length > 0" class="mt-2 mb-2 p-2 border rounded bg-light">
          <div class="fw-bold small text-secondary mb-1">Plan de Mensualidad (Global):</div>
          <select v-model="hijo.editPlanPorSede['global']" class="form-select form-select-sm" style="max-width: 240px;">
            <option :value="null">Sin plan (usa Tarifa General)</option>
            <option v-for="p in planesPorSede['global']" :key="p.id" :value="p.id">
              📋 {{ p.nombre }}
            </option>
          </select>
        </div>
      </div>

      <!-- Card: Cobros Extras (solo si son OPCIONALES) -->
      <div v-if="(clubConfig?.cobraMatricula && !clubConfig?.matriculaObligatoria) || (clubConfig?.cobraSeguro && !clubConfig?.seguroObligatorio)" class="card p-2 bg-light border mt-2">
        <div class="fw-bold small text-secondary mb-1">💳 Cobros Extras:</div>
        <div class="d-flex gap-3 flex-wrap">
          <div v-if="clubConfig?.cobraMatricula && !clubConfig?.matriculaObligatoria" class="form-check">
            <input type="checkbox" :id="'chk-mat-' + idx" v-model="hijo.adquiereMatricula" class="form-check-input">
            <label :for="'chk-mat-' + idx" class="form-check-label small fw-semibold">
              🎓 Adquirir Matrícula Opcional ({{ formatCOP(clubConfig?.montoMatricula) }})
            </label>
          </div>
          <div v-if="clubConfig?.cobraSeguro && !clubConfig?.seguroObligatorio" class="form-check">
            <input type="checkbox" :id="'chk-seg-' + idx" v-model="hijo.adquiereSeguro" class="form-check-input">
            <label :for="'chk-seg-' + idx" class="form-check-label small fw-semibold">
              🛡️ Adquirir Seguro Opcional ({{ formatCOP(clubConfig?.montoSeguro) }})
            </label>
          </div>
        </div>
      </div>

      <!-- Card: Complementos (Gym Virtual, Pista Adicional, etc.) — solo para deportistas ya guardados -->
      <div v-if="hijo.id && complementosCatalogo.length > 0" class="card p-2 bg-light border mt-2">
        <div class="fw-bold small text-secondary mb-1">🧩 Complementos:</div>
        <div class="d-flex gap-3 flex-wrap">
          <div v-for="comp in complementosCatalogo" :key="comp.id" class="form-check">
            <input
              type="checkbox"
              :id="'chk-comp-' + idx + '-' + comp.id"
              :checked="tieneComplemento(hijo, comp.id)"
              @change="toggleComplemento(hijo, comp)"
              class="form-check-input"
            >
            <label :for="'chk-comp-' + idx + '-' + comp.id" class="form-check-label small fw-semibold">
              {{ comp.nombre }}{{ comp.vecesPorPeriodo ? ` (${comp.vecesPorPeriodo}x/${comp.escenario?.periodo === 'MENSUAL' ? 'mes' : 'semana'})` : '' }}
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="d-flex gap-3 mt-4 pt-3 border-top">
      <AppButton variant="outline" size="md" icon="✖" class="flex-fill" @click="$emit('cancelar')">Cancelar</AppButton>
      <AppButton variant="outline" size="md" icon="💾" class="flex-fill" @click="guardarEdicion">Guardar</AppButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import AppButton from '@/components/ui/AppButton.vue';
import { isLimiteAlcanzado } from '@/utils/auth';
import { usePlanesMensualidad } from '@/utils/usePlanesMensualidad';

const esAdmin = localStorage.getItem('authRole') === 'ADMIN';
const limiteAlcanzado = computed(() => isLimiteAlcanzado());
const props = defineProps({ padre: { type: Object, required: true }, sedes: { type: Array, default: () => [] }, esCortesia: { type: Boolean, default: false } });
const emit = defineEmits(['recargar', 'cancelar', 'notificar']);

const clubConfig = ref(null);

// ——— Planes de mensualidad por sede (catálogo compartido, ver usePlanesMensualidad) ———
const { planesPorSede, cargarPlanesDeSede } = usePlanesMensualidad();

// ——— Complementos (Gym Virtual, Pista Adicional, etc.) ———
const complementosCatalogo = ref([]);
const complementosDeHijo = ref({}); // hijoId -> [{ id: asignacionId, complemento: {...} }]

async function cargarComplementosCatalogo() {
  try {
    const res = await axios.get('/api/complementos');
    complementosCatalogo.value = (res.data || []).filter(c => c.activo !== false);
  } catch (e) {
    console.error('Error al cargar catálogo de complementos:', e);
  }
}

async function cargarComplementosDeHijo(hijoId) {
  if (!hijoId) return;
  try {
    const res = await axios.get(`/api/complementos/estudiante/${hijoId}`);
    complementosDeHijo.value[hijoId] = res.data || [];
  } catch (e) {
    console.error('Error al cargar complementos del deportista:', e);
  }
}

function tieneComplemento(hijo, complementoId) {
  const asignaciones = complementosDeHijo.value[hijo.id] || [];
  return asignaciones.some(a => a.complemento.id === complementoId);
}

async function toggleComplemento(hijo, complemento) {
  const asignaciones = complementosDeHijo.value[hijo.id] || [];
  const existente = asignaciones.find(a => a.complemento.id === complemento.id);
  try {
    if (existente) {
      await axios.delete(`/api/complementos/estudiante/${hijo.id}/${existente.id}`);
    } else {
      const sedeOrigenId = (hijo.editSedeIds || [])[0];
      if (!sedeOrigenId) {
        emit('notificar', { tipo: 'warning', titulo: 'Sede requerida', mensaje: 'El deportista debe estar matriculado en al menos una sede para asignar complementos.' });
        return;
      }
      await axios.post(`/api/complementos/estudiante/${hijo.id}`, { complementoId: complemento.id, sedeOrigenId });
    }
    await cargarComplementosDeHijo(hijo.id);
  } catch (e) {
    emit('notificar', { tipo: 'danger', titulo: 'Error', mensaje: e.response?.data?.error || 'No se pudo actualizar el complemento.' });
  }
}

onMounted(async () => {
  try {
    const res = await axios.get('/api/config/cobro');
    clubConfig.value = res.data;
  } catch (e) {
    console.error('Error al cargar config de cobro:', e);
  }

  await cargarComplementosCatalogo();

  for (const hijo of props.padre.students || []) {
    if (!hijo.editPlanPorSede) hijo.editPlanPorSede = {};
    for (const m of hijo.matriculas || []) {
      if (m.sede && m.planMensualidad) {
        hijo.editPlanPorSede[m.sede.id] = m.planMensualidad.id;
        if (!hijo.editPlanPorSede['global']) {
          hijo.editPlanPorSede['global'] = m.planMensualidad.id;
        }
      }
      if (m.sede && m.esPrincipal) {
        hijo.editSedePrincipalId = m.sede.id;
      }
    }
    if (!hijo.editSedePrincipalId && (hijo.editSedeIds || []).length > 0) {
      hijo.editSedePrincipalId = hijo.editSedeIds[0];
    }
    for (const sid of hijo.editSedeIds || []) {
      cargarPlanesDeSede(sid);
    }
    if (hijo.id) {
      cargarComplementosDeHijo(hijo.id);
    }
  }
});

function formatCOP(val) {
  if (val == null) return '$ 0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
}

// Las sedes de las que el deportista ya hace parte van primero (en el orden en que las
// eligió); el resto de las sedes activas del club van abajo, alfabéticas — así no hay que
// buscar entre todas las sedes del club para ver/editar las que ya tiene asignadas.
function sedesOrdenadas(hijo) {
  const activas = props.sedes.filter(s => s.activa !== false);
  const idsAsignados = hijo.editSedeIds || [];
  const asignadas = idsAsignados
    .map(id => activas.find(s => s.id === id))
    .filter(Boolean);
  const noAsignadas = activas
    .filter(s => !idsAsignados.includes(s.id))
    .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  return [...asignadas, ...noAsignadas];
}

const calcularEdad = (h) => {
  if (!h.editFechaNacimiento) return;
  const hoy = new Date(), c = new Date(h.editFechaNacimiento);
  let e = hoy.getFullYear() - c.getFullYear();
  const m = hoy.getMonth() - c.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < c.getDate())) e--;
  h.editEdad = e >= 0 ? e : 0;
};

const agregarDeportistaLocal = () => {
  if (!props.padre.students) {
    props.padre.students = [];
  }
  const primeraSede = props.sedes && props.sedes.length > 0 ? props.sedes.find(s => s.activa !== false) : null;
  const primerGrupo = primeraSede && primeraSede.grupos && primeraSede.grupos.length > 0 ? primeraSede.grupos[0] : null;

  const editSedeIds = primeraSede ? [primeraSede.id] : [];
  const editNiveles = {};
  if (primeraSede && primerGrupo) {
    editNiveles[primeraSede.id] = (primerGrupo.emoji ? primerGrupo.emoji + ' ' : '') + primerGrupo.nombre;
  }

  const editPlanPorSede = {};

  props.padre.students.push({
    id: null,
    editNombre: '',
    editEdad: 10,
    editFechaNacimiento: '',
    editSedeIds: editSedeIds,
    editNiveles: editNiveles,
    editPlanPorSede: editPlanPorSede,
    editSedePrincipalId: primeraSede ? primeraSede.id : null
  });

  if (primeraSede) cargarPlanesDeSede(primeraSede.id);
};

const quitarDeportistaNuevo = (idx) => {
  props.padre.students.splice(idx, 1);
};

const sincronizarMatricula = (hijo, sedeId) => {
  if (!hijo.editSedeIds) hijo.editSedeIds = [];
  if (!hijo.editNiveles) hijo.editNiveles = {};
  if (!hijo.editPlanPorSede) hijo.editPlanPorSede = {};

  if (!hijo.editSedeIds.includes(sedeId)) {
    delete hijo.editNiveles[sedeId];
    delete hijo.editPlanPorSede[sedeId];
    if (hijo.editSedePrincipalId === sedeId) {
      hijo.editSedePrincipalId = hijo.editSedeIds[0] || null;
    }
  } else {
    const targetSede = props.sedes.find(s => s.id === sedeId);
    if (targetSede && targetSede.grupos && targetSede.grupos.length > 0) {
      const g0 = targetSede.grupos[0];
      hijo.editNiveles[sedeId] = (g0.emoji ? g0.emoji + ' ' : '') + g0.nombre;
    } else {
      hijo.editNiveles[sedeId] = '';
    }
    if (!hijo.editSedePrincipalId) {
      hijo.editSedePrincipalId = sedeId;
    }
    cargarPlanesDeSede(sedeId);
  }
};

const guardarEdicion = async () => {
  if (!props.padre.editNombre || props.padre.editNombre.trim() === '') {
    emit('notificar', { tipo: 'warning', titulo: 'Nombre Requerido', mensaje: 'El nombre del acudiente es obligatorio.' });
    return;
  }

  if (props.padre.students) {
    for (const hijo of props.padre.students) {
      if (!hijo.editNombre || hijo.editNombre.trim() === '') {
        emit('notificar', { tipo: 'warning', titulo: 'Deportista Inválido', mensaje: 'Todos los deportistas deben tener un nombre.' });
        return;
      }
      if (!hijo.editSedeIds || hijo.editSedeIds.length === 0) {
        emit('notificar', { tipo: 'warning', titulo: 'Sede Requerida', mensaje: 'Selecciona al menos una sede para: ' + hijo.editNombre });
        return;
      }
      const sedesSinGrupo = (hijo.editSedeIds || []).filter(sid => !hijo.editNiveles[sid] || hijo.editNiveles[sid] === '');
      if (sedesSinGrupo.length > 0) {
        emit('notificar', { tipo: 'warning', titulo: 'Grupo Requerido', mensaje: 'Por favor selecciona un grupo para todas las sedes del deportista: ' + hijo.editNombre });
        return;
      }
      // El Plan solo es obligatorio en la sede PRINCIPAL: ahí es donde se le cobra la mensualidad.
      const sedePrincipalId = hijo.editSedePrincipalId || hijo.editSedeIds[0];
      const planPrincipal = clubConfig.value?.preciosDiferenciados
        ? (hijo.editPlanPorSede && hijo.editPlanPorSede[sedePrincipalId])
        : (hijo.editPlanPorSede && hijo.editPlanPorSede['global']);
      if (!planPrincipal) {
        emit('notificar', { tipo: 'warning', titulo: 'Plan Requerido', mensaje: 'Selecciona el Plan de la sede principal para: ' + hijo.editNombre + '. Sin un plan, no queda ningún cobro asignado.' });
        return;
      }
    }
  }

  try {
    await axios.put('/api/registro/padre/' + props.padre.id, null, {
      params: { nombreCompleto: props.padre.editNombre, telefono: props.padre.editTelefono, estado: props.padre.editEstado }
    });
    const eh = props.padre.editEstado === 'INACTIVO' ? 'RETIRADO' : 'ACTIVO';
    let huboAjustePorCambioDePlan = false;
    if (props.padre.students && props.padre.students.length > 0) {
      const respuestas = await Promise.all(props.padre.students.map(hijo => {
        const matriculas = [];
        (hijo.editSedeIds || []).forEach(sid => {
          if (hijo.editNiveles[sid]) {
            const planId = clubConfig.value?.preciosDiferenciados
              ? ((hijo.editPlanPorSede && hijo.editPlanPorSede[sid]) || null)
              : ((hijo.editPlanPorSede && hijo.editPlanPorSede['global']) || null);
            matriculas.push({
              sedeId: sid,
              nivel: hijo.editNiveles[sid],
              planMensualidadId: planId,
              esPrincipal: sid === (hijo.editSedePrincipalId || (hijo.editSedeIds || [])[0])
            });
          }
        });

        if (hijo.id) {
          // No tocar el estado de un prospecto de cortesía en una edición general de la
          // familia — solo se activa explícitamente con el botón "Matricular".
          const estadoAEnviar = hijo.estado === 'CORTESIA' ? 'CORTESIA' : eh;
          return axios.put('/api/registro/deportista/' + hijo.id, {
            nombreCompleto: hijo.editNombre,
            edad: hijo.editEdad,
            fechaNacimiento: hijo.editFechaNacimiento,
            estado: estadoAEnviar,
            adquiereMatricula: hijo.adquiereMatricula,
            adquiereSeguro: hijo.adquiereSeguro,
            matriculas: matriculas
          });
        } else {
          return axios.post('/api/registro/deportista', {
            parentId: props.padre.id,
            nombre: hijo.editNombre,
            apellido: '',
            edad: hijo.editEdad,
            fechaNacimiento: hijo.editFechaNacimiento,
            adquiereMatricula: hijo.adquiereMatricula,
            adquiereSeguro: hijo.adquiereSeguro,
            matriculas: matriculas
          });
        }
      }));
      huboAjustePorCambioDePlan = respuestas.some(r => r?.data?.reconciliacionAplicada === true);
    }
    const mensajeExtra = huboAjustePorCambioDePlan
      ? ' Se generó un ajuste automático (cargo o saldo a favor) porque cambiaste el plan de mensualidad de un deportista que ya tenía el mes pagado — revísalo en su Historial.'
      : '';
    emit('notificar', { tipo: 'success', titulo: 'Cambios Guardados', mensaje: 'Se actualizaron los datos del acudiente y sus deportistas correctamente.' + mensajeExtra });
    emit('cancelar');
    emit('recargar');
  } catch (error) {
    console.error("Detalle del error:", error);
    const apiError = error.response?.data;
    if (apiError && (apiError.error === 'LIMITE_DEPORTISTAS_EXCEDIDO' || (apiError.mensaje && apiError.mensaje.includes('Alejandro')))) {
      emit('notificar', {
        tipo: 'danger',
        titulo: '⚠️ Límite del Plan Alcanzado',
        mensaje: apiError.mensaje || 'Ups, has alcanzado el número máximo de deportistas permitido en tu plan. Por favor, contacta al administrador Alejandro para actualizar tu membresía.'
      });
    } else {
      const serverMsg = error.response?.data?.mensaje || error.response?.data?.error || 'Hubo un error al guardar los cambios en el servidor.';
      const serverTitle = error.response?.data?.error ? 'Operación no permitida' : 'Error al Guardar';
      emit('notificar', { tipo: 'danger', titulo: serverTitle, mensaje: serverMsg });
    }
  }
};

const eliminarDeportista = async (idHijo, nombreHijo) => {
  if (!confirm('¿Eliminar a ' + nombreHijo + '?')) return;
  try {
    await axios.delete('/api/registro/deportista/' + idHijo);
    emit('notificar', { tipo: 'success', titulo: 'Deportista Eliminado', mensaje: `Se eliminó al deportista ${nombreHijo} del sistema.` });
    if (Array.isArray(props.padre.students)) {
      props.padre.students = props.padre.students.filter(h => h.id !== idHijo);
    }
    emit('cancelar');
    emit('recargar');
  } catch (error) {
    console.error("Detalle del error:", error);
    const serverMsg = error.response?.data?.mensaje || error.response?.data?.error || 'Hubo un error al intentar eliminar el deportista.';
    emit('notificar', { tipo: 'danger', titulo: 'Error al Eliminar', mensaje: serverMsg });
  }
};

const eliminarPadre = async () => {
  if (!confirm('🚨 ¿Eliminar a ' + props.padre.nombreCompleto + ' y TODOS sus deportistas?')) return;
  try {
    const res = await axios.delete('/api/registro/padre/' + props.padre.id);
    emit('notificar', { tipo: 'success', titulo: 'Familia Eliminada', mensaje: res.data });
    emit('cancelar');
    emit('recargar');
  } catch (error) {
    console.error("Detalle del error:", error);
    const serverMsg = error.response?.data?.mensaje || error.response?.data?.error || 'Hubo un error al intentar eliminar la familia.';
    emit('notificar', { tipo: 'danger', titulo: 'Error al Eliminar', mensaje: serverMsg });
  }
};
</script>
