<template>
  <div class="bg-white p-3 shadow-sm panel-edicion">
    <div class="d-flex justify-content-between align-items-center border-bottom pb-1 mb-2">
      <h6 class="text-secondary fw-bold mb-0">Editar Padre</h6>
      <button v-if="esAdmin && padre.estado === 'INACTIVO'" @click="eliminarPadre" class="btn btn-sm btn-outline-danger py-0 px-2 fw-bold">🗑️ Eliminar Definitivamente</button>
    </div>
    <input type="text" v-model="padre.editNombre" class="form-control form-control-sm mb-2" placeholder="Nombre Completo">
    <input type="text" v-model="padre.editTelefono" class="form-control form-control-sm mb-2" placeholder="Telefono">
    <select v-model="padre.editEstado" class="form-select form-select-sm mb-4 fw-bold" style="background: var(--input-bg); border-color: var(--input-border);">
      <option value="ACTIVO">🟢 ACTIVO</option>
      <option value="INACTIVO">🔴 INACTIVO</option>
    </select>
    <h6 class="text-secondary fw-bold border-bottom pb-1">Editar Deportistas</h6>
    <div v-for="(hijo, idx) in padre.students" :key="hijo.id" class="mb-3 border-start border-3 ps-2 position-relative" style="border-color: #cbd5e1 !important;">
      <div class="d-flex gap-2 mb-1">
        <input type="text" v-model="hijo.editNombre" class="form-control form-control-sm" placeholder="Nombre del Deportista">
        <button v-if="esAdmin && padre.estado === 'INACTIVO'" @click="eliminarDeportista(hijo.id, hijo.editNombre)" class="app-btn app-btn--danger app-btn--sm" style="padding: 2px 8px;">🗑️</button>
      </div>
      <div class="d-flex gap-1 mt-1">
        <input type="date" v-model="hijo.editFechaNacimiento" @change="calcularEdad(hijo)" class="form-control form-control-sm w-50">
        <input type="number" v-model="hijo.editEdad" class="form-control form-control-sm w-25 bg-light text-secondary fw-bold text-center" readonly title="Edad calculada">
      </div>
      <div class="mt-2">
        <div class="fw-bold small text-secondary mb-1">Sedes / Grupos:</div>
        <div v-for="s in sedes.filter(s => s.activa !== false)" :key="s.id" class="mb-2 border-bottom pb-1">
          <div class="form-check">
            <input type="checkbox" :id="'chk-' + idx + '-' + s.id" :value="s.id" v-model="hijo.editSedeIds" class="form-check-input" @change="sincronizarMatricula(hijo, s.id)">
            <label :for="'chk-' + idx + '-' + s.id" class="form-check-label fw-bold small">{{ s.nombre }}</label>
          </div>
          <select v-if="hijo.editSedeIds.includes(s.id)" v-model="hijo.editNiveles[s.id]" class="form-select form-select-sm mt-1 fw-bold" style="max-width: 220px;">
            <option value="" disabled>Selecciona grupo...</option>
            <template v-for="g in (s.grupos || [])" :key="g.nombre">
              <option v-if="g && g.nombre && g.nombre.trim() !== ''" :value="(g.emoji || '') + ' ' + g.nombre">{{ g.emoji ? g.emoji + ' ' : '' }}{{ g.nombre }}</option>
            </template>
          </select>
        </div>
      </div>
    </div>
    <div class="d-flex gap-2 mt-4 pt-2 border-top">
      <button @click="$emit('cancelar')" class="app-btn app-btn--ghost app-btn--sm" style="flex:1">✖ Cancelar</button>
      <button @click="guardarEdicion" class="app-btn app-btn--primary app-btn--sm" style="flex:1">💾 Guardar</button>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios';

const esAdmin = localStorage.getItem('authRole') === 'ADMIN';
const props = defineProps({ padre: { type: Object, required: true }, sedes: { type: Array, default: () => [] } });
const emit = defineEmits(['recargar', 'cancelar']);

const calcularEdad = (h) => {
  if (!h.editFechaNacimiento) return;
  const hoy = new Date(), c = new Date(h.editFechaNacimiento);
  let e = hoy.getFullYear() - c.getFullYear();
  const m = hoy.getMonth() - c.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < c.getDate())) e--;
  h.editEdad = e >= 0 ? e : 0;
};

const sincronizarMatricula = (hijo, sedeId) => {
  if (!hijo.editSedeIds.includes(sedeId)) { delete hijo.editNiveles[sedeId]; }
  else { hijo.editNiveles[sedeId] = ''; }
};

const guardarEdicion = async () => {
  if (props.padre.students) {
    for (const hijo of props.padre.students) {
      const sedesSinGrupo = (hijo.editSedeIds || []).filter(sid => !hijo.editNiveles[sid] || hijo.editNiveles[sid] === '');
      if (sedesSinGrupo.length > 0) {
        alert('⚠️ Por favor selecciona un grupo para todas las sedes marcadas en el deportista: ' + (hijo.editNombre || hijo.nombreCompleto));
        return;
      }
    }
  }
  try {
    await axios.put('/api/registro/padre/' + props.padre.id, null, {
      params: { nombreCompleto: props.padre.editNombre, telefono: props.padre.editTelefono, estado: props.padre.editEstado }
    });
    const eh = props.padre.editEstado === 'INACTIVO' ? 'RETIRADO' : 'ACTIVO';
    if (props.padre.students && props.padre.students.length > 0) {
      await Promise.all(props.padre.students.map(hijo => {
        const matriculas = [];
        (hijo.editSedeIds || []).forEach(sid => {
          if (hijo.editNiveles[sid]) matriculas.push({ sedeId: sid, nivel: hijo.editNiveles[sid] });
        });
        return axios.put('/api/registro/deportista/' + hijo.id, {
          nombreCompleto: hijo.editNombre, edad: hijo.editEdad,
          fechaNacimiento: hijo.editFechaNacimiento, estado: eh, matriculas: matriculas
        });
      }));
    }
    alert("✅ Cambios guardados correctamente.");
    emit('cancelar');
    emit('recargar');
  } catch (error) {
    console.error("Detalle del error:", error);
    alert("Hubo un error al cambiar los datos.");
  }
};

const eliminarDeportista = async (idHijo, nombreHijo) => {
  if (!confirm('¿Eliminar a ' + nombreHijo + '?')) return;
  try {
    await axios.delete('/api/registro/deportista/' + idHijo);
    alert('✅ Eliminado.');
    if (Array.isArray(props.padre.students)) {
      props.padre.students = props.padre.students.filter(h => h.id !== idHijo);
    }
    emit('cancelar');
    emit('recargar');
  } catch (error) {
    console.error("Detalle del error:", error);
    alert("Hubo un error al cambiar los datos.");
  }
};

const eliminarPadre = async () => {
  if (!confirm('🚨 ¿Eliminar a ' + props.padre.nombreCompleto + ' y TODOS sus deportistas?')) return;
  try {
    const res = await axios.delete('/api/registro/padre/' + props.padre.id);
    alert(res.data);
    emit('cancelar');
    emit('recargar');
  } catch (error) {
    console.error("Detalle del error:", error);
    alert("Hubo un error al cambiar los datos.");
  }
};
</script>

<style scoped>
.panel-edicion { border-top: 2px solid var(--bs-primary); }
</style>
