<template>
  <div class="mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="mb-0">👤 Gestión de Empleados</h3>
      <button class="btn btn-primary fw-bold shadow-sm" @click="abrirNuevo">
        ➕ Nuevo Empleado
      </button>
    </div>

    <!-- Formulario nuevo/editar -->
    <div v-if="mostrarFormulario" class="card shadow-sm border-primary mb-4">
      <div class="card-body">
        <h5 class="card-title mb-3">{{ editandoId ? '✏️ Editar Empleado' : '👤 Nuevo Empleado' }}</h5>
        
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-semibold small">Usuario</label>
            <input type="text" v-model="formUsername" class="form-control" placeholder="Nombre de usuario" />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold small">{{ editandoId ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña' }}</label>
            <input type="password" v-model="formPassword" class="form-control" placeholder="••••••" />
          </div>
        </div>

        <div class="row g-3 mt-2">
          <div class="col-md-6">
            <label class="form-label fw-semibold small">Rol</label>
            <select v-model="formRole" class="form-select">
              <option value="EMPLEADO">🧑‍💼 Empleado</option>
              <option value="ADMIN">🛡️ Administrador</option>
            </select>
          </div>
          <div class="col-md-6" v-if="formRole === 'EMPLEADO'">
            <label class="form-label fw-semibold small">Sedes Autorizadas</label>
            <div class="border rounded p-2" style="max-height: 120px; overflow-y: auto;">
              <div v-for="sede in sedesDisponibles" :key="sede.id" class="form-check">
                <input
                  type="checkbox"
                  :value="sede.id"
                  :id="'sede-' + sede.id"
                  v-model="formSedeIds"
                  class="form-check-input"
                />
                <label :for="'sede-' + sede.id" class="form-check-label small">{{ sede.nombre }}</label>
              </div>
              <div v-if="sedesDisponibles.length === 0" class="text-muted small text-center py-2">
                No hay sedes disponibles. Crea una primero.
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex gap-2 mt-4">
          <button class="btn btn-success fw-bold shadow-sm px-4" @click="guardar" :disabled="!formUsername.trim() || (!editandoId && !formPassword.trim())">
            💾 Guardar
          </button>
          <button class="btn btn-outline-secondary px-4" @click="cancelar">✖ Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Tabla de empleados -->
    <div class="card shadow-sm">
      <div class="card-body p-0">
        <table class="table table-hover mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Sedes Autorizadas</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in empleados" :key="emp.id">
              <td class="text-muted">{{ emp.id }}</td>
              <td class="fw-bold">{{ emp.username }}</td>
              <td>
                <span class="badge" :class="emp.role === 'ADMIN' ? 'bg-dark' : 'bg-primary'">
                  {{ emp.role === 'ADMIN' ? '🛡️ Admin' : '🧑‍💼 Empleado' }}
                </span>
              </td>
              <td class="small">
                <span v-if="emp.sedesAutorizadas && emp.sedesAutorizadas.length > 0">
                  {{ emp.sedesAutorizadas.map(s => s.nombre).join(', ') }}
                </span>
                <span v-else class="text-muted">Todas</span>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-1" @click="editar(emp)">✏️</button>
                <button class="btn btn-sm btn-outline-danger" @click="eliminar(emp)">🗑️</button>
              </td>
            </tr>
            <tr v-if="empleados.length === 0">
              <td colspan="5" class="text-center text-muted py-4">No hay empleados registrados</td>
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

const empleados = ref([]);
const sedesDisponibles = ref([]);
const mostrarFormulario = ref(false);
const editandoId = ref(null);
const formUsername = ref('');
const formPassword = ref('');
const formRole = ref('EMPLEADO');
const formSedeIds = ref([]);

const cargarEmpleados = async () => {
  try {
    const res = await axios.get('/api/empleados');
    empleados.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

const cargarSedes = async () => {
  try {
    const res = await axios.get('/api/sedes');
    sedesDisponibles.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

const abrirNuevo = () => {
  editandoId.value = null;
  formUsername.value = '';
  formPassword.value = '';
  formRole.value = 'EMPLEADO';
  formSedeIds.value = [];
  mostrarFormulario.value = true;
};

const editar = (emp) => {
  editandoId.value = emp.id;
  formUsername.value = emp.username;
  formPassword.value = '';
  formRole.value = emp.role;
  formSedeIds.value = (emp.sedesAutorizadas || []).map(s => s.id);
  mostrarFormulario.value = true;
};

const guardar = async () => {
  if (!formUsername.value.trim()) return;
  if (!editandoId.value && !formPassword.value.trim()) return;

  const body = {
    username: formUsername.value.trim(),
    role: formRole.value,
    sedeIds: formSedeIds.value
  };

  if (formPassword.value.trim()) {
    body.password = formPassword.value.trim();
  }

  try {
    if (editandoId.value) {
      await axios.put(`/api/empleados/${editandoId.value}`, body);
    } else {
      await axios.post('/api/empleados', body);
    }
    cancelar();
    cargarEmpleados();
  } catch (e) {
    alert('Error al guardar el empleado');
    console.error(e);
  }
};

const cancelar = () => {
  mostrarFormulario.value = false;
  editandoId.value = null;
  formUsername.value = '';
  formPassword.value = '';
  formRole.value = 'EMPLEADO';
  formSedeIds.value = [];
};

const eliminar = async (emp) => {
  if (!confirm(`¿Eliminar al empleado "${emp.username}"?`)) return;
  try {
    await axios.delete(`/api/empleados/${emp.id}`);
    cargarEmpleados();
  } catch (e) {
    alert('Error al eliminar el empleado');
    console.error(e);
  }
};

onMounted(() => {
  cargarEmpleados();
  cargarSedes();
});
</script>
