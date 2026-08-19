<template>
  <div class="gestion-empleados-view">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-0">👤 Gestión de Empleados y Entrenadores</h3>
        <p class="text-secondary small mb-0">Administra los entrenadores, sus tarifas por clase individual y sedes autorizadas.</p>
      </div>
      <button class="btn btn-primary fw-bold shadow-sm" @click="abrirNuevo">
        ➕ Nuevo Empleado
      </button>
    </div>

    <!-- Formulario Nuevo Empleado -->
    <div v-if="empleadoIdEnEdicion === -1" class="card shadow-sm mb-4">
      <div class="card-body">
        <h5 class="card-title mb-3">➕ Registrar Nuevo Empleado</h5>

        <div v-if="errorForm" class="alert alert-danger py-2 small">{{ errorForm }}</div>

        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-semibold small">Nombre Completo *</label>
            <input type="text" v-model="formNombreCompleto" class="form-control" placeholder="ej: Carlos Alberto Rodríguez" />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold small">Nombre de Usuario (Login) *</label>
            <input type="text" v-model="formUsername" class="form-control" placeholder="ej: entrenador_carlos" />
          </div>
        </div>

        <div class="row g-3 mt-1">
          <div class="col-md-4">
            <label class="form-label fw-semibold small">Contraseña *</label>
            <input type="password" v-model="formPassword" class="form-control" placeholder="Mínimo 6 caracteres" />
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold small">Confirmar Contraseña *</label>
            <input type="password" v-model="formConfirmPassword" class="form-control" placeholder="Repite la contraseña" />
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold small">Rol</label>
            <select v-model="formRole" class="form-select">
              <option value="EMPLEADO">🧑‍💼 Entrenador / Empleado</option>
              <option value="ADMIN">🛡️ Administrador del Club</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label fw-semibold small">Tarifa por Clase (COP)</label>
            <input
              :value="formatInputCurrency(formTarifaPorClase)"
              @input="formTarifaPorClase = parseCurrencyInput($event.target.value)"
              type="text"
              class="form-control"
              placeholder="$ 35.000"
              :disabled="tarifaDeshabilitada"
              :title="tarifaDeshabilitada ? 'Este admin está exento de nómina: la tarifa no aplica' : ''"
            />
          </div>
        </div>

        <div class="row g-3 mt-1" v-if="formRole === 'EMPLEADO'">
          <div class="col-md-12">
            <div class="form-check">
              <input type="checkbox" v-model="formPuedeRecaudar" id="puede-recaudar-new" class="form-check-input" />
              <label for="puede-recaudar-new" class="form-check-label small fw-semibold">💵 Permitir recibir abonos/pagos en efectivo</label>
            </div>
          </div>
        </div>

        <div class="row g-3 mt-1" v-if="formRole === 'ADMIN'">
          <div class="col-md-12">
            <div class="form-check">
              <input type="checkbox" v-model="formExentoNomina" id="exento-nomina-new" class="form-check-input" />
              <label for="exento-nomina-new" class="form-check-label small fw-semibold">🚫 Exento de nómina (las clases que registre este admin no se liquidan automáticamente)</label>
            </div>
          </div>
        </div>

        <div class="row g-3 mt-1" v-if="formRole === 'EMPLEADO'">
          <div class="col-md-12">
            <label class="form-label fw-semibold small">Sedes Autorizadas</label>
            <div class="border rounded p-2 bg-light" style="max-height: 120px; overflow-y: auto;">
              <div v-for="sede in sedesDisponibles.filter(s => s.activa !== false)" :key="sede.id" class="form-check">
                <input
                  type="checkbox"
                  :value="sede.id"
                  :id="'sede-new-' + sede.id"
                  v-model="formSedeIds"
                  class="form-check-input"
                />
                <label :for="'sede-new-' + sede.id" class="form-check-label small fw-semibold">{{ sede.nombre }}</label>
              </div>
              <div v-if="sedesDisponibles.length === 0" class="text-muted small text-center py-2">
                No hay sedes disponibles. Crea una primero en la sección de Sedes.
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex gap-2 mt-4">
          <button class="btn btn-primary px-4 fw-bold" @click="guardar" :disabled="!formUsername.trim() || !formPassword.trim()">
            💾 Guardar Empleado
          </button>
          <button class="btn btn-outline-secondary px-4" @click="cancelar">✕ Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Tabla de Empleados (Limpia: Nombre Completo, Usuario, Rol, Sedes) -->
    <div class="card shadow-sm">
      <div class="card-body p-0">
        <table class="table table-hover mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th>Nombre Completo</th>
              <th>Usuario (Login)</th>
              <th>Rol</th>
              <th>Tarifa</th>
              <th>Recauda</th>
              <th>Sedes Autorizadas</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="emp in empleados" :key="emp.id">
              <tr>
                <td class="fw-bold">
                  {{ emp.nombreCompleto || emp.username }}
                  <span v-if="emp.esUsuarioActual" class="badge bg-info text-dark ms-1">Tú</span>
                </td>
                <td><code class="text-dark">@{{ emp.username }}</code></td>
                <td>
                  <span class="badge" :class="emp.role === 'ADMIN' ? 'bg-dark' : 'bg-primary'">
                    {{ emp.role === 'ADMIN' ? '🛡️ Admin' : '🧑‍💼 Entrenador' }}
                  </span>
                </td>
                <td class="fw-semibold text-success">
                  <span v-if="emp.role === 'ADMIN' && emp.exentoNomina" class="badge bg-secondary fw-normal">🚫 Exento</span>
                  <template v-else>
                    {{ emp.tarifaPorClase ? formatCOP(emp.tarifaPorClase) + ' /clase' : '—' }}
                  </template>
                </td>
                <td>
                  <span v-if="emp.role === 'EMPLEADO'" class="badge" :class="emp.puedeRecaudar ? 'bg-success' : 'bg-secondary'">
                    {{ emp.puedeRecaudar ? '💵 Sí' : 'No' }}
                  </span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="small">
                  <span v-if="emp.sedeNombres && emp.sedeNombres.length > 0" class="badge bg-light text-dark border">
                    {{ emp.sedeNombres.join(', ') }}
                  </span>
                  <span v-else class="text-muted">Todas / Sin sede</span>
                </td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-1" @click="editar(emp)">✏️</button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    :disabled="emp.esUsuarioActual"
                    :title="emp.esUsuarioActual ? 'No puedes eliminar tu propia cuenta' : ''"
                    @click="eliminar(emp)"
                  >🗑️</button>
                </td>
              </tr>

              <!-- Fila de edición inline -->
              <tr v-if="empleadoIdEnEdicion === emp.id" class="edit-row">
                <td colspan="7" class="p-3">
                  <div class="p-3 edit-card rounded border">
                    <h6 class="fw-bold mb-3">✏️ Editar Empleado — {{ emp.nombreCompleto || emp.username }}</h6>
                    <div v-if="errorForm" class="alert alert-danger py-2 small">{{ errorForm }}</div>
                    <div class="row g-3">
                      <div class="col-md-4">
                        <label class="form-label small fw-semibold">Nombre Completo</label>
                        <input type="text" v-model="formNombreCompleto" class="form-control form-control-sm" />
                      </div>
                      <div class="col-md-4">
                        <label class="form-label small fw-semibold">Contraseña (dejar en blanco para conservar)</label>
                        <input type="password" v-model="formPassword" class="form-control form-control-sm" placeholder="Mínimo 6 caracteres" />
                      </div>
                      <div class="col-md-4" v-if="formPassword">
                        <label class="form-label small fw-semibold">Confirmar Contraseña</label>
                        <input type="password" v-model="formConfirmPassword" class="form-control form-control-sm" placeholder="Repite la contraseña" />
                      </div>
                    </div>
                    <div class="row g-3 mt-1">
                      <div class="col-md-4">
                        <label class="form-label small fw-semibold">Tarifa por Clase (COP)</label>
                        <input
                          :value="formatInputCurrency(formTarifaPorClase)"
                          @input="formTarifaPorClase = parseCurrencyInput($event.target.value)"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="$ 35.000"
                          :disabled="tarifaDeshabilitada"
                          :title="tarifaDeshabilitada ? 'Este admin está exento de nómina: la tarifa no aplica' : ''"
                        />
                      </div>
                      <div class="col-md-4">
                        <label class="form-label small fw-semibold">Rol</label>
                        <select v-model="formRole" class="form-select form-select-sm">
                          <option value="EMPLEADO">🧑‍💼 Entrenador / Empleado</option>
                          <option value="ADMIN">🛡️ Administrador del Club</option>
                        </select>
                      </div>
                      <div class="col-md-4 d-flex align-items-end" v-if="formRole === 'EMPLEADO'">
                        <div class="form-check">
                          <input type="checkbox" v-model="formPuedeRecaudar" id="puede-recaudar-edit" class="form-check-input" />
                          <label for="puede-recaudar-edit" class="form-check-label small fw-semibold">💵 Puede recaudar pagos</label>
                        </div>
                      </div>
                      <div class="col-md-4 d-flex align-items-end" v-if="formRole === 'ADMIN'">
                        <div class="form-check">
                          <input type="checkbox" v-model="formExentoNomina" id="exento-nomina-edit" class="form-check-input" />
                          <label for="exento-nomina-edit" class="form-check-label small fw-semibold">🚫 Exento de nómina</label>
                        </div>
                      </div>
                      <div class="col-md-12 mt-2" v-if="formRole === 'EMPLEADO'">
                        <label class="form-label small fw-semibold">Sedes Autorizadas</label>
                        <div class="border rounded p-2 bg-light" style="max-height: 100px; overflow-y: auto;">
                          <div v-for="sede in sedesDisponibles.filter(s => s.activa !== false)" :key="sede.id" class="form-check">
                            <input
                              type="checkbox"
                              :value="sede.id"
                              :id="'sede-edit-' + sede.id"
                              v-model="formSedeIds"
                              class="form-check-input"
                            />
                            <label :for="'sede-edit-' + sede.id" class="form-check-label small">{{ sede.nombre }}</label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="d-flex gap-2 mt-3">
                      <button class="btn btn-sm btn-primary px-3" @click="guardar">💾 Guardar Cambios</button>
                      <button class="btn btn-sm btn-secondary px-3" @click="cancelar">✕ Cancelar</button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'

const empleados = ref([])
const sedesDisponibles = ref([])
const empleadoIdEnEdicion = ref(null)

const formNombreCompleto = ref('')
const formUsername = ref('')
const formPassword = ref('')
const formConfirmPassword = ref('')
const formRole = ref('EMPLEADO')
const formTarifaPorClase = ref(null)
const formPuedeRecaudar = ref(false)
const formExentoNomina = ref(true)
const formSedeIds = ref([])
const errorForm = ref('')

// Un ADMIN exento de nómina no necesita tarifa: se deshabilita y se limpia el
// campo automáticamente para que no quede una configuración inútil guardada.
const tarifaDeshabilitada = computed(() => formRole.value === 'ADMIN' && formExentoNomina.value)

watch(tarifaDeshabilitada, (deshabilitada) => {
  if (deshabilitada) {
    formTarifaPorClase.value = null
  }
})

onMounted(async () => {
  await Promise.all([cargarEmpleados(), cargarSedes()])
})

async function cargarEmpleados() {
  try {
    const res = await axios.get('/api/empleados')
    empleados.value = res.data
  } catch (e) {
    console.error('Error al cargar empleados:', e)
  }
}

async function cargarSedes() {
  try {
    const res = await axios.get('/api/sedes')
    sedesDisponibles.value = res.data
  } catch (e) {
    console.error('Error al cargar sedes:', e)
  }
}

function abrirNuevo() {
  empleadoIdEnEdicion.value = -1
  formNombreCompleto.value = ''
  formUsername.value = ''
  formPassword.value = ''
  formConfirmPassword.value = ''
  formRole.value = 'EMPLEADO'
  formTarifaPorClase.value = null
  formPuedeRecaudar.value = false
  formExentoNomina.value = true
  formSedeIds.value = []
  errorForm.value = ''
}

function editar(emp) {
  empleadoIdEnEdicion.value = emp.id
  formNombreCompleto.value = emp.nombreCompleto || emp.username
  formUsername.value = emp.username
  formPassword.value = ''
  formConfirmPassword.value = ''
  formRole.value = emp.role || 'EMPLEADO'
  formTarifaPorClase.value = emp.tarifaPorClase || null
  formPuedeRecaudar.value = !!emp.puedeRecaudar
  formExentoNomina.value = emp.exentoNomina !== false
  formSedeIds.value = emp.sedeIds ? [...emp.sedeIds] : []
  errorForm.value = ''
}

function cancelar() {
  empleadoIdEnEdicion.value = null
  errorForm.value = ''
}

async function guardar() {
  errorForm.value = ''

  if (empleadoIdEnEdicion.value === -1 && (!formPassword.value || formPassword.value.length < 6)) {
    errorForm.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (formPassword.value && formPassword.value.length < 6) {
    errorForm.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (formPassword.value && formPassword.value !== formConfirmPassword.value) {
    errorForm.value = 'Las contraseñas no coinciden.'
    return
  }

  const payload = {
    nombreCompleto: formNombreCompleto.value,
    username: formUsername.value,
    password: formPassword.value,
    role: formRole.value,
    tarifaPorClase: formTarifaPorClase.value,
    puedeRecaudar: formPuedeRecaudar.value,
    exentoNomina: formExentoNomina.value,
    sedeIds: formSedeIds.value
  }

  try {
    if (empleadoIdEnEdicion.value === -1) {
      await axios.post('/api/empleados', payload)
    } else {
      await axios.put(`/api/empleados/${empleadoIdEnEdicion.value}`, payload)
    }
    cancelar()
    await cargarEmpleados()
  } catch (e) {
    alert('Error al guardar empleado: ' + (e.response?.data?.error || e.message))
  }
}

async function eliminar(emp) {
  if (!confirm(`¿Eliminar al empleado "${emp.nombreCompleto || emp.username}"?`)) return
  try {
    await axios.delete(`/api/empleados/${emp.id}`)
    await cargarEmpleados()
  } catch (e) {
    alert('Error al eliminar empleado: ' + e.message)
  }
}

function formatCOP(val) {
  if (val == null) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)
}

function formatInputCurrency(val) {
  if (val == null || val === '') return ''
  const num = typeof val === 'number' ? val : parseFloat(val)
  if (isNaN(num)) return ''
  return '$ ' + new Intl.NumberFormat('es-CO').format(num)
}

function parseCurrencyInput(text) {
  if (!text) return null
  const clean = text.replace(/[^0-9]/g, '')
  if (!clean) return null
  return parseInt(clean, 10)
}
</script>

<style scoped>
.gestion-empleados-view { padding: 20px 0; }
.edit-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--border-primary, #e2e8f0) !important;
  box-shadow: none !important;
  outline: none !important;
}
.edit-card:hover, .edit-card:focus-within, .edit-card:focus {
  border-color: var(--border-primary, #e2e8f0) !important;
  box-shadow: none !important;
  outline: none !important;
}
</style>
