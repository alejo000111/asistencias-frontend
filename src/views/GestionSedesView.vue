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
        <div class="row g-2">
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
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sede in sedes" :key="sede.id">
              <td class="text-muted">{{ sede.id }}</td>
              <td class="fw-bold">{{ sede.nombre }}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" @click="editar(sede)">✏️</button>
                <button class="btn btn-sm btn-outline-danger" @click="eliminar(sede)">🗑️</button>
              </td>
            </tr>
            <tr v-if="sedes.length === 0">
              <td colspan="3" class="text-center text-muted py-4">No hay sedes registradas</td>
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
  mostrarFormulario.value = true;
};

const editar = (sede) => {
  editandoId.value = sede.id;
  formNombre.value = sede.nombre;
  mostrarFormulario.value = true;
};

const guardar = async () => {
  if (!formNombre.value.trim()) return;
  try {
    if (editandoId.value) {
      await axios.put(`/api/sedes/${editandoId.value}`, { nombre: formNombre.value.trim() });
    } else {
      await axios.post('/api/sedes', { nombre: formNombre.value.trim() });
    }
    mostrarFormulario.value = false;
    formNombre.value = '';
    editandoId.value = null;
    cargarSedes();
  } catch (e) {
    alert('Error al guardar la sede');
    console.error(e);
  }
};

const cancelar = () => {
  mostrarFormulario.value = false;
  formNombre.value = '';
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
