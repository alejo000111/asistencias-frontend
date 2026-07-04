<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="mb-0 mt-0">🏢 Gestión de Sedes</h3>
      <AppButton variant="primary" @click="abrirNueva">
        ➕ Nueva Sede
      </AppButton>
    </div>

    <!-- ============================================================
         FORMULARIO NUEVA SEDE (arriba de la tabla)
         ============================================================ -->
    <div v-if="sedeIdEnEdicion === -1" class="card shadow-sm mb-4">
      <div class="card-body">
        <h5 class="card-title mb-3 text-success">🏗️ Nueva Sede</h5>

        <!-- Nombre + Estado -->
        <div class="row g-2 mb-3">
          <div class="col-md-8">
            <input
              type="text"
              v-model="formSedeEdicion.nombre"
              class="form-control"
              placeholder="Nombre de la sede (ej. Sede Norte)"
              @keyup.enter="guardar"
            />
          </div>
          <div class="col-md-4 d-flex align-items-center">
            <div class="form-check form-switch mb-0">
              <input
                class="form-check-input"
                type="checkbox"
                role="switch"
                v-model="formSedeEdicion.activa"
                id="nuevaActivaSwitch"
              />
              <label class="form-check-label fw-medium" for="nuevaActivaSwitch">
                {{ formSedeEdicion.activa ? '✅ Activa' : '⛔ Inactiva' }}
              </label>
            </div>
          </div>
        </div>

        <!-- Grupos -->
        <div class="border rounded-3 p-3 bg-light">
          <label class="form-label fw-semibold mb-2">Grupos de la Sede</label>

          <!-- Lista de grupos con inputs inline -->
          <div v-for="(grupo, idx) in formSedeEdicion.grupos" :key="idx" class="d-flex gap-2 mb-2 align-items-end">
            <div style="flex: 2;">
              <AppInput
                v-model="grupo.nombre"
                size="sm"
                :placeholder="'Nombre del grupo ' + (idx + 1)"
                label="Nombre"
              />
            </div>
            <div style="flex: 1;">
              <AppInput
                v-model="grupo.emoji"
                size="sm"
                placeholder="🌱🔥⭐"
                label="Emoji (opcional)"
                maxlength="5"
              />
            </div>
            <div style="flex: 1;">
              <label class="small text-muted mb-0">Color</label>
              <div class="d-flex gap-3 align-items-center">
                <input
                  type="color"
                  v-model="grupo.colorHex"
                  class="form-control form-control-color p-1"
                  style="height: 31px;"
                />
                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm"
                  @click="formSedeEdicion.grupos.splice(idx, 1)"
                  title="Eliminar grupo"
                >🗑️</button>
              </div>
            </div>
          </div>

          <!-- Botón "+ Añadir grupo" -->
          <div class="mt-2">
            <button
              type="button"
              class="btn btn-outline-primary"
              :disabled="!ultimoGrupoTieneNombre"
              @click.prevent="agregarGrupo"
            >
              + Añadir grupo
            </button>
          </div>

          <div v-if="errorFormulario" class="alert alert-danger py-2 mb-0 mt-2" role="alert">
            {{ errorFormulario }}
          </div>
        </div>

        <div class="d-flex gap-2 mt-3 justify-content-end">
          <AppButton variant="outline" size="lg" @click="guardar">💾 Guardar</AppButton>
          <AppButton variant="outline" size="lg" @click="cancelar">✖ Cancelar</AppButton>
        </div>
      </div>
    </div>

    <!-- ============================================================
         TABLA DE SEDES CON EDICIÓN INLINE
         ============================================================ -->
    <div class="card shadow-sm">
      <div class="card-body p-0">
        <table class="table table-hover mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Grupos</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="sede in sedes" :key="sede.id">
              <!-- Fila principal: datos de la sede -->
              <tr :class="{ 'table-secondary opacity-75': sede.activa === false }">
                <td class="text-muted">{{ sede.id }}</td>
                <td class="fw-bold">{{ sede.nombre }}</td>
                <td>
                  <span v-if="sede.activa === false" class="badge bg-secondary fs-6 px-3 py-2">📦 ARCHIVADA</span>
                  <span v-else class="badge bg-success fs-6 px-3 py-2">✅ Activa</span>
                </td>
                <td>
                  <span v-if="!sede.grupos || sede.grupos.length === 0" class="text-muted small">—</span>
                  <span v-else class="d-flex flex-wrap gap-1">
                    <span
                      v-for="(g, gIdx) in sede.grupos"
                      :key="gIdx"
                      class="badge text-white fw-bold shadow-sm fs-6 px-3 py-2"
                      :style="{ backgroundColor: g.colorHex || '#6c757d' }"
                    >{{ g.emoji ? g.emoji + ' ' : '' }}{{ g.nombre }}</span>
                  </span>
                </td>
                <td class="text-center">
                  <template v-if="sede.activa !== false">
                    <div class="d-flex gap-2 justify-content-center">
                      <AppButton
                        variant="outline"
                        size="md"
                        @click="editar(sede)"
                      >✏️</AppButton>
                      <AppButton
                        variant="danger"
                        size="md"
                        @click="eliminar(sede)"
                      >🗑️</AppButton>
                    </div>
                  </template>
                  <span v-else class="text-muted small fst-italic">Archivada</span>
                </td>
              </tr>

              <!-- Fila de edición inline (debajo de la sede) -->
              <tr v-if="sedeIdEnEdicion === sede.id" class="edit-row">
                <td colspan="5" class="p-0 border-0">
                  <div class="p-4" style="background: var(--gray-50);">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                      <h5 class="mb-0 fw-semibold">✏️ Editando: {{ formSedeEdicion.nombre || sede.nombre }}</h5>
                    </div>

                    <!-- Nombre + Estado -->
                    <div class="row g-2 mb-3">
                      <div class="col-md-8">
                        <input
                          type="text"
                          v-model="formSedeEdicion.nombre"
                          class="form-control"
                          placeholder="Nombre de la sede"
                          @keyup.enter="guardar"
                        />
                      </div>
                      <div class="col-md-4 d-flex align-items-center">
                        <div class="form-check form-switch mb-0">
                          <input
                            class="form-check-input"
                            type="checkbox"
                            role="switch"
                            v-model="formSedeEdicion.activa"
                            :id="'editActivaSwitch-' + sede.id"
                          />
                          <label class="form-check-label fw-medium" :for="'editActivaSwitch-' + sede.id">
                            {{ formSedeEdicion.activa ? '✅ Activa' : '⛔ Inactiva' }}
                          </label>
                        </div>
                      </div>
                    </div>

                    <!-- Grupos -->
                    <div class="border rounded-3 p-3 bg-white">
                      <label class="form-label fw-semibold mb-2">Grupos de la Sede</label>

                      <!-- Lista de grupos con inputs inline -->
                      <div v-if="formSedeEdicion.grupos.length === 0" class="text-muted small mb-2">
                        No hay grupos agregados.
                      </div>
                      <div
                        v-for="(grupo, idx) in formSedeEdicion.grupos"
                        :key="idx"
                        class="d-flex gap-2 mb-2 align-items-end"
                      >
                        <div style="flex: 2;">
                          <AppInput
                            v-model="grupo.nombre"
                            size="sm"
                            :placeholder="'Nombre del grupo ' + (idx + 1)"
                            label="Nombre"
                          />
                        </div>
                        <div style="flex: 1;">
                          <AppInput
                            v-model="grupo.emoji"
                            size="sm"
                            placeholder="🌱🔥⭐"
                            label="Emoji (opcional)"
                            maxlength="5"
                          />
                        </div>
                        <div style="flex: 1;">
                          <label class="small text-muted mb-0">Color</label>
                          <div class="d-flex gap-3 align-items-center">
                            <input
                              type="color"
                              v-model="grupo.colorHex"
                              class="form-control form-control-color p-1"
                              style="height: 31px;"
                            />
                            <button
                              type="button"
                              class="btn btn-outline-danger btn-sm"
                              @click="formSedeEdicion.grupos.splice(idx, 1)"
                              title="Eliminar grupo"
                            >🗑️</button>
                          </div>
                        </div>
                      </div>

                      <!-- Botón "+ Añadir grupo" -->
                      <div class="mt-2">
                        <button
                          type="button"
                          class="btn btn-outline-primary"
                          :disabled="!ultimoGrupoTieneNombre"
                          @click.prevent="agregarGrupo"
                        >
                          + Añadir grupo
                        </button>
                      </div>

                      <div v-if="errorFormulario" class="alert alert-danger py-2 mb-0 mt-2" role="alert">
                        {{ errorFormulario }}
                      </div>
                    </div>

                    <div class="d-flex gap-2 mt-3 justify-content-end">
                      <AppButton variant="outline" size="md" @click="guardar">
                        💾 Guardar Cambios
                      </AppButton>
                      <AppButton variant="outline" size="md" @click="cancelar">
                        ✖ Cancelar
                      </AppButton>
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="sedes.length === 0">
              <td colspan="5" class="text-center text-muted py-4">No hay sedes registradas</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';

import { useSedes } from '@/utils/useSedes';

// ——— Estado de sedes ———
const { sedes, cargarSedes } = useSedes();

// ——— Control de edición ———
const sedeIdEnEdicion = ref(null); // null = nada, -1 = nueva, >0 = editando

// ——— Formulario de edición/creación (deep clone) ———
const formSedeEdicion = ref(null);

// ——— Errores ———
const errorFormulario = ref('');

// ——— Computed: el botón "+ Añadir grupo" se inhabilita si el último grupo
//     agregado no tiene nombre. Si no hay grupos, se habilita para poder
//     agregar el primero. ———
const ultimoGrupoTieneNombre = computed(() => {
  const grupos = formSedeEdicion.value?.grupos;
  if (!grupos || grupos.length === 0) return true; // sin grupos → habilitado
  const ultimo = grupos[grupos.length - 1];
  return ultimo.nombre && ultimo.nombre.trim() !== '';
});

// ================================================================
//  CARGAR SEDES
// ================================================================


// ================================================================
//  LIMPIAR ERRORES
// ================================================================
const limpiarErrores = () => {
  errorFormulario.value = '';
};

// ================================================================
//  ABRIR NUEVA SEDE
// ================================================================
const abrirNueva = () => {
  cancelar();
  sedeIdEnEdicion.value = -1;
  formSedeEdicion.value = {
    id: null,
    nombre: '',
    activa: true,
    grupos: [
      { nombre: '', emoji: '', colorHex: '#f97316' }
    ]
  };
  limpiarErrores();
};

// ================================================================
//  EDITAR SEDE (inline debajo de la fila)
// ================================================================
const editar = (sede) => {
  if (sedeIdEnEdicion.value === sede.id) return;
  cancelar();

  sedeIdEnEdicion.value = sede.id;
  formSedeEdicion.value = JSON.parse(JSON.stringify(sede));
  limpiarErrores();
};

// ================================================================
//  VALIDAR FORMULARIO
// ================================================================
const validarFormulario = () => {
  limpiarErrores();

  if (!formSedeEdicion.value) return false;

  if (!formSedeEdicion.value.nombre.trim()) {
    errorFormulario.value = '⚠️ El nombre de la sede es obligatorio.';
    return false;
  }

  const grupos = formSedeEdicion.value.grupos || [];
  if (grupos.length === 0) {
    errorFormulario.value = '⚠️ Debe agregar al menos un grupo a la sede antes de guardar.';
    return false;
  }

  for (let i = 0; i < grupos.length; i++) {
    if (!grupos[i] || !grupos[i].nombre || !grupos[i].nombre.trim()) {
      errorFormulario.value = '⚠️ Todos los grupos deben tener un nombre válido.';
      return false;
    }
  }

  return true;
};

// ================================================================
//  AGREGAR GRUPO — solo empuja un objeto vacío, sin HTTP
//  El usuario edita sus campos directamente en los inputs inline
// ================================================================
const agregarGrupo = () => {
  if (!formSedeEdicion.value) return;

  // Antes de agregar, validar que el último grupo (si existe) tenga nombre
  const grupos = formSedeEdicion.value.grupos || [];
  if (grupos.length > 0) {
    const ultimo = grupos[grupos.length - 1];
    if (!ultimo.nombre || !ultimo.nombre.trim()) {
      // El computed ultimoGrupoTieneNombre ya debería tener el botón deshabilitado,
      // pero esta validación extra protege contra llamadas directas (ej: tecla Enter)
      return;
    }
  }

  grupos.push({ nombre: '', emoji: '', colorHex: '#f97316' });

  // Limpiar error de grupos vacíos si existía
  if (errorFormulario.value && grupos.length > 0) {
    // Solo limpiar si el error era específicamente por falta de grupos
    if (errorFormulario.value.includes('al menos un grupo')) {
      errorFormulario.value = '';
    }
  }
};

// ================================================================
//  GUARDAR (POST / PUT según corresponda)
// ================================================================
const guardar = async () => {
  if (!formSedeEdicion.value) return;
  if (!validarFormulario()) return;

  try {
    const payload = {
      nombre: formSedeEdicion.value.nombre.trim(),
      activa: formSedeEdicion.value.activa,
      grupos: (formSedeEdicion.value.grupos || []).filter(g => g && g.nombre && g.nombre.trim() !== '')
    };

    if (sedeIdEnEdicion.value === -1) {
      await axios.post('/api/sedes', payload);
    } else {
      await axios.put(`/api/sedes/${sedeIdEnEdicion.value}`, payload);
    }

    sedeIdEnEdicion.value = null;
    formSedeEdicion.value = null;
    limpiarErrores();
    cargarSedes();
  } catch (e) {
    alert('Error al guardar la sede. Revisa los datos o la consola.');
    console.error('Error al guardar sede:', e);
  }
};

// ================================================================
//  CANCELAR (descarta cambios, restaura estado)
// ================================================================
const cancelar = () => {
  sedeIdEnEdicion.value = null;
  formSedeEdicion.value = null;
  limpiarErrores();
};

// ================================================================
//  ELIMINAR (soft-delete: archiva la sede)
// ================================================================
const eliminar = async (sede) => {
  if (!confirm(`¿Archivar la sede "${sede.nombre}"? Los estudiantes asociados serán desmatriculados.`)) return;
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

<style scoped>
.edit-row td {
  border-bottom: 2px solid var(--orange-200) !important;
}
</style>
