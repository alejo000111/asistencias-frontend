<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="mb-0 mt-0">👤 Gestión de Empleados</h3>
      <button class="btn btn-primary fw-bold shadow-sm" @click="abrirNuevo">
        ➕ Nuevo Empleado
      </button>
    </div>

    <!-- Formulario nuevo (arriba de la tabla) -->
    <div v-if="empleadoIdEnEdicion === -1" class="card shadow-sm mb-4">
      <div class="card-body">
        <h5 class="card-title mb-3">👤 Nuevo Empleado</h5>
        
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-semibold small">Usuario</label>
            <input type="text" v-model="formUsername" class="form-control" placeholder="Nombre de usuario" />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold small">Contraseña</label>
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
              <div v-for="sede in sedesDisponibles.filter(s => s.activa !== false)" :key="sede.id" class="form-check">
                <input
                  type="checkbox"
                  :value="sede.id"
                  :id="'sede-new-' + sede.id"
                  v-model="formSedeIds"
                  class="form-check-input"
                />
                <label :for="'sede-new-' + sede.id" class="form-check-label small">{{ sede.nombre }}</label>
              </div>
              <div v-if="sedesDisponibles.length === 0" class="text-muted small text-center py-2">
                No hay sedes disponibles. Crea una primero.
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex gap-2 mt-4">
          <button class="btn btn-outline-secondary btn-premium-action btn-premium-save px-4" @click="guardar" :disabled="!formUsername.trim() || !formPassword.trim()">
            💾 Guardar
          </button>
          <button class="btn btn-outline-secondary btn-premium-action btn-premium-cancel px-4" @click="cancelar">✖ Cancelar</button>
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
            <template v-for="emp in empleados" :key="emp.id">
              <tr>
                <td class="text-muted">{{ emp.id }}</td>
                <td class="fw-bold">{{ emp.username }}</td>
                <td>
                  <span class="badge" :class="emp.role === 'ADMIN' ? 'bg-dark' : 'bg-primary'">
                    {{ emp.role === 'ADMIN' ? '🛡️ Admin' : '🧑‍💼 Empleado' }}
                  </span>
                </td>
                <td class="small">
                  <span v-if="emp.sedeNombres && emp.sedeNombres.length > 0">
                    {{ emp.sedeNombres.join(', ') }}
                  </span>
                  <span v-else class="text-muted">Todas / Sin sede</span>
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-1" @click="editar(emp)">✏️</button>
                  <button class="btn btn-sm btn-outline-danger" @click="eliminar(emp)">🗑️</button>
                </td>
              </tr>
              <!-- Fila de edición inline (debajo del empleado) -->
              <tr v-if="empleadoIdEnEdicion === emp.id" class="edit-row">
                <td colspan="5" class="p-4 border-0">
                  <div class="p-4 rounded border" style="background: var(--bg-tertiary);">
                    <h5 class="mb-3">✏️ Editar Empleado: {{ emp.username }}</h5>
                    
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label class="form-label fw-semibold small">Usuario</label>
                        <input type="text" v-model="formUsername" class="form-control" placeholder="Nombre de usuario" />
                      </div>
                      <div class="col-md-6">
                        <label class="form-label fw-semibold small">Nueva Contraseña (dejar vacío para mantener)</label>
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
                          <div v-for="sede in sedesDisponibles.filter(s => s.activa !== false)" :key="sede.id" class="form-check">
                            <input
                              type="checkbox"
                              :value="sede.id"
                              :id="'sede-edit-' + emp.id + '-' + sede.id"
                              v-model="formSedeIds"
                              class="form-check-input"
                            />
                            <label :for="'sede-edit-' + emp.id + '-' + sede.id" class="form-check-label small">{{ sede.nombre }}</label>
                          </div>
                          <div v-if="sedesDisponibles.length === 0" class="text-muted small text-center py-2">
                            No hay sedes disponibles. Crea una primero.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="d-flex gap-2 mt-4">
                      <button class="btn btn-outline-secondary btn-premium-action btn-premium-save px-4" @click="guardar" :disabled="!formUsername.trim()">
                        💾 Guardar
                      </button>
                      <button class="btn btn-outline-secondary btn-premium-action btn-premium-cancel px-4" @click="cancelar">✖ Cancelar</button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
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
import { useSedes } from '@/utils/useSedes';

const { sedes: sedesDisponibles, cargarSedes } = useSedes();

const empleadoIdEnEdicion = ref(null); // null = cerrado, -1 = nuevo, >0 = editando
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

const abrirNuevo = () => {
  cancelar();
  empleadoIdEnEdicion.value = -1;
  formUsername.value = '';
  formPassword.value = '';
  formRole.value = 'EMPLEADO';
  formSedeIds.value = [];
};

const editar = (emp) => {
  if (empleadoIdEnEdicion.value === emp.id) return;
  cancelar();
  empleadoIdEnEdicion.value = emp.id;
  formUsername.value = emp.username;
  formPassword.value = '';
  formRole.value = emp.role;
  formSedeIds.value = emp.sedeIds || [];
};

const guardar = async () => {
  if (!formUsername.value.trim()) return;
  const esNuevo = empleadoIdEnEdicion.value === -1;
  if (esNuevo && !formPassword.value.trim()) return;

  const body = {
    username: formUsername.value.trim(),
    role: formRole.value,
    sedeIds: formSedeIds.value
  };

  if (formPassword.value.trim()) {
    body.password = formPassword.value.trim();
  }

  try {
    if (esNuevo) {
      await axios.post('/api/empleados', body);
    } else {
      await axios.put(`/api/empleados/${empleadoIdEnEdicion.value}`, body);
    }
    cancelar();
    cargarEmpleados();
  } catch (e) {
    alert('Error al guardar el empleado');
    console.error(e);
  }
};

const cancelar = () => {
  empleadoIdEnEdicion.value = null;
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

<style scoped>
.edit-row td {
  border-bottom: 2px solid var(--orange-200) !important;
}

.btn-premium-action {
  font-weight: 700 !important;
  border-width: 2px !important;
  border-radius: 8px !important;
  letter-spacing: 0.03em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all var(--transition-fast);
}

.btn-premium-save {
  border-color: var(--color-success) !important;
}

.btn-premium-save:hover:not(:disabled) {
  background-color: var(--color-success) !important;
  border-color: var(--color-success) !important;
  color: white !important;
}

.btn-premium-cancel {
  border-color: var(--color-danger) !important;
}

.btn-premium-cancel:hover {
  background-color: var(--color-danger) !important;
  border-color: var(--color-danger) !important;
  color: white !important;
}
</style>
