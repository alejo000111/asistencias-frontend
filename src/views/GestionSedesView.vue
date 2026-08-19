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
          <div :class="colNameClass">
            <input
              type="text"
              v-model="formSedeEdicion.nombre"
              class="form-control"
              placeholder="Nombre de la sede (ej. Sede Norte)"
              @keyup.enter="guardar"
            />
          </div>
          
          <!-- Tarifas de Clase Suelta (solo si hay precios diferenciados) -->
          <div v-if="clubConfig?.preciosDiferenciados" class="col-md-3">
            <input
              type="text"
              :value="formatInputCurrency(formSedeEdicion.precioGrupal)"
              @input="formSedeEdicion.precioGrupal = parseCurrencyInput($event.target.value)"
              class="form-control"
              placeholder="Clase Suelta ($)"
              title="Valor por 1 clase suelta"
            />
          </div>

          <div :class="colSwitchClass" class="d-flex align-items-center">
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

        <!-- Escenario: qué tipo de espacio es esta sede (Cancha, Pista, Gimnasio...).
             Solo aparece si el club ya creó escenarios en Ajustes de Cobro. -->
        <div v-if="escenariosActivos.length > 0" class="row g-2 mb-3">
          <div class="col-md-6">
            <label class="form-label small fw-semibold mb-1">🏟️ Escenario de esta sede</label>
            <select v-model.number="formSedeEdicion.escenarioId" class="form-select">
              <option :value="null">— Sin escenario —</option>
              <option v-for="esc in escenariosActivos" :key="esc.id" :value="esc.id">
                {{ esc.emoji ? esc.emoji + ' ' : '' }}{{ esc.nombre }}
              </option>
            </select>
            <div class="form-text small" style="color: var(--text-secondary);">
              Las sedes que comparten escenario suman su cuota de asistencia entre todas.
            </div>
          </div>
        </div>

        <!-- Grupos -->
        <div class="border rounded-3 p-3" style="background: var(--bg-secondary); border-color: var(--border-primary) !important;">
          <label class="form-label fw-semibold mb-2" style="color: var(--text-primary);">Grupos de la Sede</label>

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
              <label class="small mb-0" style="color: var(--text-secondary);">Color</label>
              <div class="d-flex gap-3 align-items-center">
                <input
                  type="color"
                  v-model="grupo.colorHex"
                  class="form-control form-control-color p-1"
                  style="height: 31px;"
                />
                <button
                  type="button"
                  class="btn btn-danger text-white btn-sm shadow-sm"
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
          <AppButton variant="outline" class="btn-sedes-save" size="lg" @click="guardar">💾 Guardar</AppButton>
          <AppButton variant="outline" class="btn-sedes-cancel" size="lg" @click="cancelar">✖ Cancelar</AppButton>
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
              <th>Nombre</th>
              <th v-if="escenariosActivos.length > 0">Escenario</th>
              <th v-if="clubConfig?.preciosDiferenciados">Clase Suelta</th>
              <th>Estado</th>
              <th>Grupos</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="sede in sedes" :key="sede.id">
              <!-- Fila principal: datos de la sede -->
              <tr :class="{ 'table-secondary opacity-75': sede.activa === false }">
                <td class="fw-bold">{{ sede.nombre }}</td>
                <td v-if="escenariosActivos.length > 0">
                  <span v-if="sede.escenario">
                    {{ sede.escenario.emoji ? sede.escenario.emoji + ' ' : '' }}{{ sede.escenario.nombre }}
                  </span>
                  <span v-else class="text-muted small">—</span>
                </td>

                <td v-if="clubConfig?.preciosDiferenciados">
                  <span v-if="preciosSedes[sede.id]?.grupal != null" class="badge bg-primary-subtle text-primary-emphasis px-2 py-1 fs-6">
                    {{ formatCOP(preciosSedes[sede.id].grupal) }}
                  </span>
                  <span v-else class="text-muted small">—</span>
                </td>

                <td>
                  <span v-if="sede.activa === false">⛔ Inactiva</span>
                  <span v-else>✅ Activa</span>
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
                  <div class="d-flex gap-2 justify-content-center">
                    <button
                      class="btn btn-action d-flex align-items-center gap-1 px-3 py-1"
                      @click="editar(sede)"
                      title="Editar Sede"
                    >
                      <span style="font-size: 0.85rem;">✏️</span>
                      <span>Editar</span>
                    </button>

                    <button
                      v-if="sede.activa !== false"
                      class="btn btn-action d-flex align-items-center gap-1 px-3 py-1"
                      @click="desactivar(sede)"
                      title="Desactivar Sede"
                    >
                      <span style="font-size: 0.85rem;">✕</span>
                      <span>Desactivar</span>
                    </button>

                    <button
                      v-else
                      class="btn btn-action d-flex align-items-center gap-1 px-3 py-1"
                      @click="eliminarDefinitivamente(sede)"
                      title="Eliminar Sede Permanentemente"
                    >
                      <span style="font-size: 0.85rem;">🗑️</span>
                      <span>Eliminar</span>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Fila de edición inline (debajo de la sede) -->
              <tr v-if="sedeIdEnEdicion === sede.id" class="edit-row">
                <td :colspan="colspanTabla" class="p-0 border-0">
                  <div class="p-4" style="background: var(--gray-50);">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                      <h5 class="mb-0 fw-semibold">✏️ Editando: {{ formSedeEdicion.nombre || sede.nombre }}</h5>
                    </div>

                    <!-- Nombre + Estado + Tarifas -->
                    <div class="row g-2 mb-3">
                      <div :class="colNameClass">
                        <input
                          type="text"
                          v-model="formSedeEdicion.nombre"
                          class="form-control"
                          placeholder="Nombre de la sede"
                          @keyup.enter="guardar"
                        />
                      </div>
                      <!-- Tarifas de Clase Suelta (solo si hay precios diferenciados) -->
                      <div v-if="clubConfig?.preciosDiferenciados" class="col-md-3">
                        <input
                          type="text"
                          :value="formatInputCurrency(formSedeEdicion.precioGrupal)"
                          @input="formSedeEdicion.precioGrupal = parseCurrencyInput($event.target.value)"
                          class="form-control"
                          placeholder="Clase Suelta ($)"
                          title="Valor por 1 clase suelta"
                        />
                      </div>

                      <div :class="colSwitchClass" class="d-flex align-items-center">
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

                    <!-- Escenario de esta sede -->
                    <div v-if="escenariosActivos.length > 0" class="row g-2 mb-3">
                      <div class="col-md-6">
                        <label class="form-label small fw-semibold mb-1">🏟️ Escenario de esta sede</label>
                        <select v-model.number="formSedeEdicion.escenarioId" class="form-select">
                          <option :value="null">— Sin escenario —</option>
                          <option v-for="esc in escenariosActivos" :key="esc.id" :value="esc.id">
                            {{ esc.emoji ? esc.emoji + ' ' : '' }}{{ esc.nombre }}
                          </option>
                        </select>
                        <div class="form-text small" style="color: var(--text-secondary);">
                          Las sedes que comparten escenario suman su cuota de asistencia entre todas.
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
                              class="btn btn-danger text-white btn-sm shadow-sm"
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
                      <AppButton variant="outline" class="btn-sedes-save" size="md" @click="guardar">
                        💾 Guardar Cambios
                      </AppButton>
                      <AppButton variant="outline" class="btn-sedes-cancel" size="md" @click="cancelar">
                        ✖ Cancelar
                      </AppButton>
                    </div>

                    <p class="small text-muted mt-3 mb-0">
                      💡 Los planes y precios de esta sede se administran en
                      <strong>Ajustes de Cobro</strong>, donde puedes compararlos y editarlos junto a los
                      de las demás sedes.
                    </p>
                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="sedes.length === 0">
              <td :colspan="colspanTabla" class="text-center text-muted py-4">No hay sedes registradas</td>
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
import { useEscenarios } from '@/utils/useEscenarios';

// ——— Estado de sedes ———
const { sedes, cargarSedes } = useSedes();
const { escenarios, cargarEscenarios } = useEscenarios();

// Solo los escenarios activos se ofrecen al enlazar una sede.
const escenariosActivos = computed(() => escenarios.value.filter(e => e.activo !== false && e.id != null));

// Nombre + [Escenario] + [Tarifas] + Estado + Grupos + Acciones
const colspanTabla = computed(() => {
  let n = 4;
  if (escenariosActivos.value.length > 0) n++;
  if (clubConfig.value?.preciosDiferenciados) n++;
  return n;
});

// ——— Estado de configuración de cobro ———
const clubConfig = ref(null);
const preciosSedes = ref({});

const cargarClubConfig = async () => {
  try {
    const res = await axios.get('/api/config/cobro');
    clubConfig.value = res.data;
    if (res.data && res.data.preciosPorSedeJson) {
      preciosSedes.value = JSON.parse(res.data.preciosPorSedeJson);
    } else {
      preciosSedes.value = {};
    }
  } catch (e) {
    console.error('Error al cargar config de cobro:', e);
  }
};

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

const colNameClass = computed(() => {
  if (clubConfig.value?.preciosDiferenciados) return 'col-md-4';
  return 'col-md-8';
});

const colSwitchClass = computed(() => {
  if (clubConfig.value?.preciosDiferenciados) return 'col-md-2';
  return 'col-md-4';
});

// ——— Formateador simple de COP ———
const formatCOP = (val) => {
  if (val == null || val === '') return '$ 0';
  return '$ ' + new Intl.NumberFormat('es-CO').format(val);
};

const formatInputCurrency = (val) => {
  if (val == null || val === '') return '';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '';
  return '$ ' + new Intl.NumberFormat('es-CO').format(num);
};

const parseCurrencyInput = (text) => {
  if (!text) return null;
  const clean = text.replace(/[^0-9]/g, '');
  if (!clean) return null;
  return parseInt(clean, 10);
};

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
    escenarioId: null,
    precioMensualidad: null,
    precioGrupal: null,
    precioPersonalizada: null,
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
  const clone = JSON.parse(JSON.stringify(sede));
  const precios = preciosSedes.value[sede.id] || {};
  clone.precioMensualidad = precios.mensualidad || null;
  clone.precioGrupal = precios.grupal || null;
  clone.precioPersonalizada = precios.personalizada || null;
  clone.escenarioId = sede.escenario?.id ?? null;

  formSedeEdicion.value = clone;
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

  if (clubConfig.value?.preciosDiferenciados) {
    if (formSedeEdicion.value.precioGrupal != null && formSedeEdicion.value.precioGrupal < 0) {
      errorFormulario.value = '⚠️ La tarifa de clase suelta debe ser mayor o igual a 0.';
      return false;
    }
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
      grupos: (formSedeEdicion.value.grupos || []).filter(g => g && g.nombre && g.nombre.trim() !== ''),
      // El backend re-resuelve el escenario por id y valida que sea del mismo club.
      escenario: formSedeEdicion.value.escenarioId ? { id: formSedeEdicion.value.escenarioId } : null
    };

    let savedSede;
    if (sedeIdEnEdicion.value === -1) {
      const res = await axios.post('/api/sedes', payload);
      savedSede = res.data;
    } else {
      const res = await axios.put(`/api/sedes/${sedeIdEnEdicion.value}`, payload);
      savedSede = res.data;
    }

    // Guardar precios en config de cobro si precios diferenciados está activo
    if (clubConfig.value && clubConfig.value.preciosDiferenciados && savedSede && savedSede.id) {
      const sedeId = savedSede.id;
      if (!preciosSedes.value[sedeId]) {
        preciosSedes.value[sedeId] = {};
      }

      if (clubConfig.value.esquemaCobro === 'MENSUALIDAD') {
        preciosSedes.value[sedeId].mensualidad = formSedeEdicion.value.precioMensualidad;
      } else if (clubConfig.value.esquemaCobro === 'POR_CLASE') {
        preciosSedes.value[sedeId].grupal = formSedeEdicion.value.precioGrupal;
        preciosSedes.value[sedeId].personalizada = formSedeEdicion.value.precioPersonalizada;
      }

      const configPayload = {
        ...clubConfig.value,
        preciosPorSedeJson: JSON.stringify(preciosSedes.value)
      };
      await axios.put('/api/config/cobro', configPayload);
      // Actualizar config local
      clubConfig.value.preciosPorSedeJson = configPayload.preciosPorSedeJson;
    }

    sedeIdEnEdicion.value = null;
    formSedeEdicion.value = null;
    limpiarErrores();
    cargarSedes(true);
  } catch (e) {
    errorFormulario.value = e.response?.data?.error || e.response?.data?.mensaje || e.response?.data || 'Error al guardar la sede. Revisa los datos.';
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
//  DESACTIVAR (soft-delete: desactiva la sede)
// ================================================================
const desactivar = async (sede) => {
  if (!confirm(`¿Desactivar la sede "${sede.nombre}"? Los estudiantes asociados serán desmatriculados.`)) return;
  try {
    await axios.delete(`/api/sedes/${sede.id}`);
    cargarSedes(true);
  } catch (e) {
    alert('Error al desactivar la sede');
    console.error(e);
  }
};

const eliminarDefinitivamente = async (sede) => {
  if (!confirm(`⚠️ ¿Estás seguro de ELIMINAR PERMANENTEMENTE la sede "${sede.nombre}"? Esta acción eliminará la sede de la base de datos de forma irreversible.`)) return;
  try {
    await axios.delete(`/api/sedes/${sede.id}`);
    cargarSedes(true);
  } catch (e) {
    alert('Error al eliminar permanentemente la sede');
    console.error(e);
  }
};

onMounted(async () => {
  await Promise.all([cargarClubConfig(), cargarEscenarios(true)]);
  cargarSedes(true);
});
</script>

<style scoped>
.btn-action {
  border: 2px solid var(--text-secondary);
  background: transparent;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.8rem;
  transition: all var(--transition-normal);
}

.btn-action:hover {
  background: var(--bg-tertiary);
  border-color: var(--text-primary);
}

.edit-row td {
  border-bottom: 2px solid var(--orange-200) !important;
}

.btn-sedes-save {
  border-color: var(--color-success) !important;
}

.btn-sedes-save:hover:not(:disabled) {
  background-color: var(--color-success) !important;
  border-color: var(--color-success) !important;
  color: white !important;
}

.btn-sedes-cancel {
  border-color: var(--color-danger) !important;
}

.btn-sedes-cancel:hover {
  background-color: var(--color-danger) !important;
  border-color: var(--color-danger) !important;
  color: white !important;
}
</style>
