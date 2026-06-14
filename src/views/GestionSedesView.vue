<template>
  <div class="mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="mb-0">🏢 Gestión de Sedes</h3>
      <button class="btn btn-primary fw-bold shadow-sm" @click="abrirNueva">
        ➕ Nueva Sede
      </button>
    </div>

    <!-- Formulario nuevo/editar -->
    <div v-if="mostrarFormulario" class="card shadow-sm border-primary mb-4">
      <div class="card-body">
        <h5 class="card-title mb-3">{{ editandoId ? '✏️ Editar Sede' : '🏗️ Nueva Sede' }}</h5>
        <div class="row g-2 mb-3">
          <div class="col-md-8">
            <input
              type="text"
              v-model="formNombre"
              class="form-control"
              placeholder="Nombre de la sede (ej. Sede Norte)"
              @keyup.enter="guardar"
            />
          </div>
          <div class="col-md-4 d-flex gap-2">
            <button class="btn btn-success w-50 fw-bold shadow-sm" @click="guardar" :disabled="!formNombre.trim()">
              💾 Guardar
            </button>
            <button class="btn btn-outline-secondary w-50" @click="cancelar">
              ✖ Cancelar
            </button>
          </div>
        </div>

        <!-- Grupos de la sede -->
        <div class="border rounded-3 p-3 bg-light">
          <label class="form-label fw-semibold mb-2">Grupos de la Sede</label>
          <div class="d-flex gap-2 mb-2 align-items-end">
            <div style="flex: 2;">
              <label class="small text-muted mb-0">Nombre</label>
              <input type="text" v-model="nuevoGrupo.nombre" class="form-control form-control-sm" placeholder="Ej. Iniciación" @keyup.enter="agregarGrupo" />
            </div>
            <div style="flex: 1;">
              <label class="small text-muted mb-0">Emoji</label>
              <input type="text" v-model="nuevoGrupo.emoji" class="form-control form-control-sm" placeholder="(Opcional) 🌱🔥⭐" maxlength="5" @input="limpiarEmojiInput" />
            </div>
            <div style="flex: 1;">
              <label class="small text-muted mb-0">Color</label>
              <input type="color" v-model="nuevoGrupo.colorHex" class="form-control form-control-color p-1" style="height: 31px;" />
            </div>
            <div>
              <button class="btn btn-outline-primary btn-sm px-3" @click="agregarGrupo">
                + Añadir
              </button>
            </div>
          </div>
          <div v-if="formGrupos.length === 0" class="text-muted small">
            No hay grupos agregados.
          </div>
          <div v-else class="d-flex flex-wrap gap-2">
            <span
              v-for="(grupo, idx) in formGrupos"
              :key="idx"
              class="badge d-inline-flex align-items-center gap-1 px-3 py-2 text-white fw-bold shadow-sm"
              :style="{ backgroundColor: grupo.colorHex || '#6c757d' }"
            >
              {{ grupo.emoji ? grupo.emoji + ' ' : '' }}{{ grupo.nombre }}
              <button class="btn-close btn-close-white" style="font-size: 0.5rem;" @click="formGrupos.splice(idx, 1)"></button>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de sedes -->
    <div class="card shadow-sm">
      <div class="card-body p-0">
        <table class="table table-hover mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Grupos</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sede in sedes" :key="sede.id" :class="{ 'table-secondary opacity-75': sede.activa === false }">
              <td class="text-muted">{{ sede.id }}</td>
              <td class="fw-bold">
                {{ sede.nombre }}
                <span v-if="sede.activa === false" class="badge bg-secondary ms-2">📦 ARCHIVADA</span>
              </td>
              <td>
                <span v-if="!sede.grupos || sede.grupos.length === 0" class="text-muted small">—</span>
                <span v-else class="d-flex flex-wrap gap-1">
                  <span v-for="(g, gIdx) in sede.grupos" :key="gIdx" class="badge text-white fw-bold shadow-sm" :style="{ backgroundColor: g.colorHex || '#6c757d', fontSize: '0.7rem' }">{{ g.emoji ? g.emoji + ' ' : '' }}{{ g.nombre }}</span>
                </span>
              </td>
              <td class="text-end">
                <button v-if="sede.activa !== false" class="btn btn-sm btn-outline-primary me-1" @click="editar(sede)">✏️</button>
                <button v-if="sede.activa !== false" class="btn btn-sm btn-outline-danger" @click="eliminar(sede)">🗑️</button>
                <span v-else class="text-muted small fst-italic">Archivada</span>
              </td>
            </tr>
            <tr v-if="sedes.length === 0">
              <td colspan="4" class="text-center text-muted py-4">No hay sedes registradas</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const sedes = ref([]);
const mostrarFormulario = ref(false);
const formNombre = ref('');
const editandoId = ref(null);
const formGrupos = ref([]);
const nuevoGrupo = ref({ nombre: '', emoji: '', colorHex: '#f97316' });

const cargarSedes = async () => {
  try {
    const res = await axios.get('/api/sedes');
    sedes.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

const abrirNueva = () => {
  editandoId.value = null;
  formNombre.value = '';
  formGrupos.value = [];
  nuevoGrupo.value = { nombre: '', emoji: '', colorHex: '#f97316' };
  mostrarFormulario.value = true;
};

const editar = (sede) => {
  editandoId.value = sede.id;
  formNombre.value = sede.nombre;
  formGrupos.value = [...(sede.grupos || [])];
  nuevoGrupo.value = { nombre: '', emoji: '', colorHex: '#f97316' };
  mostrarFormulario.value = true;
};

const limpiarEmojiInput = () => {
  // Auto-limpiar letras y números mientras el usuario escribe
  nuevoGrupo.value.emoji = nuevoGrupo.value.emoji.replace(/[a-zA-Z0-9]/g, '');
};

const soloEmojis = (texto) => {
  if (!texto || texto.trim() === '') return true; // vacío sí se permite
  // Regex Unicode: acepta emojis reales, banderas, skin tones, secuencias ZWJ
  return /^(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}|[\uFE0F\u200D\u20E3\u00A9\u00AE]|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\d\u20E3|[#*]\uFE0F\u20E3)+$/u.test(texto.trim());
};

const agregarGrupo = () => {
  const g = nuevoGrupo.value;
  if (!g.nombre.trim()) {
    alert('⚠️ El nombre del grupo es obligatorio.');
    return;
  }
  if (g.emoji.trim() && !soloEmojis(g.emoji)) {
    alert('⚠️ El campo de Emoji solo acepta emojis reales, no texto normal.');
    return;
  }
  const yaExiste = formGrupos.value.some(eg => eg.nombre.toLowerCase() === g.nombre.trim().toLowerCase());
  if (yaExiste) {
    alert('⚠️ Ya existe un grupo con ese nombre.');
    return;
  }
  formGrupos.value.push({
    nombre: g.nombre.trim(),
    emoji: g.emoji || '',
    colorHex: g.colorHex || '#f97316'
  });
  nuevoGrupo.value = { nombre: '', emoji: '', colorHex: '#f97316' };
};

const guardar = async () => {
  if (!formNombre.value.trim()) return;
  try {
    // Limpiar grupos fantasmas (con nombre vacío) antes de enviar
    const gruposLimpios = formGrupos.value.filter(g => g && g.nombre && g.nombre.trim() !== '');
    const payload = {
      nombre: formNombre.value.trim(),
      grupos: gruposLimpios
    };
    if (editandoId.value) {
      await axios.put(`/api/sedes/${editandoId.value}`, payload);
    } else {
      await axios.post('/api/sedes', payload);
    }
    // Solo cerrar el formulario si la petición fue exitosa
    mostrarFormulario.value = false;
    formNombre.value = '';
    formGrupos.value = [];
    nuevoGrupo.value = { nombre: '', emoji: '', colorHex: '#f97316' };
    editandoId.value = null;
    cargarSedes();
  } catch (e) {
    // No cerrar el formulario en caso de error — mantenerlo abierto para revisión
    alert('Error al guardar la sede. Revisa los datos o la consola.');
    console.error('Error al guardar sede:', e);
  }
};

const cancelar = () => {
  mostrarFormulario.value = false;
  formNombre.value = '';
  formGrupos.value = [];
  nuevoGrupo.value = { nombre: '', emoji: '', colorHex: '#f97316' };
  editandoId.value = null;
};

const eliminar = async (sede) => {
  if (!confirm(`¿Eliminar la sede "${sede.nombre}"?`)) return;
  try {
    await axios.delete(`/api/sedes/${sede.id}`);
    cargarSedes();
  } catch (e) {
    alert('Error al eliminar la sede');
    console.error(e);
  }
};

onMounted(() => cargarSedes());
</script>
