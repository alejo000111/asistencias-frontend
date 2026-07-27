<template>
  <div>
    <h3 class="mb-4 mt-0">📋 Registrar Asistencia</h3>

    <!-- Bloqueo por sede inactiva (cuando existen sedes y todas están inactivas) -->
    <div v-if="sedesCargadas && sedesDisponibles.length > 0 && sedesActivas.length === 0" class="card shadow-sm border-warning mb-4">
      <div class="card-body text-center py-5">
        <div class="display-1 mb-4">🚫</div>
        <h4 class="text-warning fw-bold mb-3">Sede Deshabilitada</h4>
        <p class="lead text-muted mb-4" style="max-width: 500px; margin: 0 auto;">
          Esta sede fue eliminada o deshabilitada por el administrador.
          Contacte a soporte para más información y reasignación.
        </p>
      </div>
    </div>

    <div v-else class="card shadow-sm border-secondary">
      <div class="card-body p-4">
        
        <div class="row mb-4">
          <div class="col-md-6 text-center mb-3 mb-md-0">
            <label class="form-label fw-bold text-dark">🏢 Sede de la clase:</label><br>
            <select v-model="sedeSeleccionada" class="form-select shadow-sm fw-bold" style="max-width: 300px; margin: 0 auto;">
              <option value="" disabled>Selecciona una sede...</option>
              <option v-for="s in sedesDisponibles.filter(s => s.activa !== false)" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>
          <div class="col-md-6 text-center">
            <label class="form-label fw-bold text-dark">Selecciona el Tipo de Clase:</label><br>
            <div class="btn-group shadow-sm" role="group">
              <input type="radio" class="btn-check" id="grupal" value="GRUPAL" v-model="tipoClase">
              <label class="btn px-4 fw-bold transition-all border" for="grupal"
                     :style="{
                       backgroundColor: tipoClase === 'GRUPAL' ? 'var(--orange-500)' : 'var(--bg-tertiary)',
                       color: tipoClase === 'GRUPAL' ? '#ffffff' : 'var(--text-primary)',
                       borderColor: tipoClase === 'GRUPAL' ? 'var(--orange-500)' : 'var(--border-primary)'
                     }">👥 Grupal</label>

              <input type="radio" class="btn-check" id="personalizada" value="PERSONALIZADA" v-model="tipoClase">
              <label class="btn px-4 fw-bold transition-all border" for="personalizada"
                     :style="{
                       backgroundColor: tipoClase === 'PERSONALIZADA' ? 'var(--orange-500)' : 'var(--bg-tertiary)',
                       color: tipoClase === 'PERSONALIZADA' ? '#ffffff' : 'var(--text-primary)',
                       borderColor: tipoClase === 'PERSONALIZADA' ? 'var(--orange-500)' : 'var(--border-primary)'
                     }">👤 Personalizada</label>
            </div>
          </div>
        </div>

        <!-- Indicador de carga para EMPLEADO (el watch dispara la petición) -->
        <div v-if="cargandoEstudiantes" class="text-center py-3">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando deportistas...</span>
          </div>
          <p class="text-muted small mt-1">Cargando deportistas...</p>
        </div>

        <div v-if="tipoClase === 'GRUPAL' && sedeSeleccionada" class="text-center mb-4">
          <label class="form-label fw-bold text-dark">Nivel del Grupo:</label><br>
          <div class="btn-group shadow-sm" role="group">
            <template v-for="(grupo, gIdx) in gruposSedeSeleccionada" :key="gIdx">
              <template v-if="grupo && grupo.nombre && grupo.nombre.trim()">
                <input type="radio" class="btn-check" :id="'grupo-' + gIdx" :value="grupo.nombre" v-model="nivelClase">
                <label class="btn px-4 fw-bold transition-all border" 
                       :for="'grupo-' + gIdx"
                       :style="{
                         backgroundColor: nivelClase === grupo.nombre ? (grupo.colorHex || '#6b7280') : 'var(--bg-tertiary)',
                         color: nivelClase === grupo.nombre ? '#ffffff' : 'var(--text-secondary)',
                         borderColor: grupo.colorHex || 'var(--border-primary)'
                       }">
                  {{ grupo.emoji ? grupo.emoji + ' ' : '' }}{{ grupo.nombre }}
                </label>
              </template>
            </template>
          </div>
        </div>

        <!-- Tabla (desktop) / Cards (mobile) -->
        <div class="table-responsive mt-3 d-none d-md-block">
          <table class="table table-hover align-middle border">
            <thead class="table-light border-bottom">
              <tr>
                <th class="text-center" style="width: 10%;">Presente</th>
                <th>Deportista</th>
                <th style="width: 150px;">Precio Especial ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="estudiante in estudiantesFiltrados" :key="estudiante.id">
                <td class="text-center">
                  <input class="form-check-input fs-4" type="checkbox" v-model="estudiante.presente">
                </td>
                <td class="fw-bold">{{ estudiante.nombreCompleto }}</td>
                <td>
                  <input type="text" class="form-control form-control-sm" :value="formatearMontoInput(estudiante.precioPersonalizado)" @input="actualizarPrecioInput($event, estudiante)" placeholder="Opcional" :disabled="!estudiante.presente">
                </td>
              </tr>
              <tr v-if="estudiantesFiltrados.length === 0">
                <td colspan="3" class="text-center text-muted py-5">
                  No hay deportistas registrados en este nivel.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Vista mobile: cards de deportistas -->
        <div class="d-md-none mt-3">
          <div v-for="estudiante in estudiantesFiltrados" :key="estudiante.id"
               class="home-estudiante-card"
               :class="{ 'home-estudiante-card--selected': estudiante.presente }"
               @click="estudiante.presente = !estudiante.presente">
            <div class="d-flex align-items-center gap-3 flex-grow-1 min-w-0">
              <div class="home-estudiante-card__checkbox">
                <input class="form-check-input fs-5 m-0" type="checkbox" v-model="estudiante.presente" @click.stop>
              </div>
              <span class="home-estudiante-card__name text-truncate">{{ estudiante.nombreCompleto }}</span>
            </div>
            <div class="ms-3" style="width: 90px; flex-shrink: 0;" @click.stop>
              <input type="text" class="form-control form-control-sm text-center" 
                     :value="formatearMontoInput(estudiante.precioPersonalizado)" 
                     @input="actualizarPrecioInput($event, estudiante)" 
                     placeholder="Precio" 
                     :disabled="!estudiante.presente">
            </div>
          </div>
          <div v-if="estudiantesFiltrados.length === 0" class="text-center text-muted py-5">
            No hay deportistas registrados en este nivel.
          </div>
        </div>

        <div class="home-footer-actions">
          <div class="home-footer-fecha">
            <label class="home-footer-label">📅 Fecha (Opcional):</label>
            <input type="date" v-model="fechaAsistencia" class="form-control">
            <small class="home-footer-hint">Si lo dejas vacío, se usará la fecha de hoy.</small>
          </div>
          <AppButton variant="success" size="lg" class="home-footer-btn" @click="registrarAsistencias" :disabled="registrando">
            {{ registrando ? '⏳ Registrando...' : '✅ Registrar Asistencias' }}
          </AppButton>
        </div>

      </div>
    </div>

    <!-- Resultado del registro de asistencias -->
    <div v-if="resultadoRegistro" class="mt-4">
      <div v-if="resultadoRegistro.fallidos.length === 0" class="alert alert-success d-flex align-items-center gap-2 shadow-sm">
        <span style="font-size: 1.5rem;">✅</span>
        <div>
          <strong class="d-block">{{ resultadoRegistro.exitosos.length }} asistencias registradas con éxito.</strong>
          <small class="text-success-emphasis">Todos los deportistas fueron registrados correctamente.</small>
        </div>
      </div>

      <div v-else class="card shadow-sm border-warning">
        <div class="card-body">
          <div class="d-flex align-items-center gap-2 mb-3">
            <span style="font-size: 1.5rem;">⚠️</span>
            <div>
              <strong class="d-block text-warning">Registro parcial</strong>
              <small class="text-muted">
                {{ resultadoRegistro.exitosos.length }} exitoso(s), {{ resultadoRegistro.fallidos.length }} fallido(s).
                Los exitosos ya quedaron guardados. Corrige los errores y registra solo los pendientes.
              </small>
            </div>
          </div>

          <div v-if="resultadoRegistro.exitosos.length > 0" class="mb-2">
            <strong class="text-success small">✔ Registrados:</strong>
            <div class="d-flex flex-wrap gap-1 mt-1">
              <span v-for="nombre in resultadoRegistro.exitosos" :key="nombre"
                    class="badge bg-success-subtle text-success-emphasis px-2 py-1">
                {{ nombre }}
              </span>
            </div>
          </div>

          <div v-if="resultadoRegistro.fallidos.length > 0">
            <strong class="text-danger small">✖ Fallaron — reinténtalos:</strong>
            <div class="d-flex flex-wrap gap-1 mt-1">
              <span v-for="f in resultadoRegistro.fallidos" :key="f.nombre"
                    class="badge bg-danger-subtle text-danger-emphasis px-2 py-1"
                    :title="f.error">
                {{ f.nombre }}
              </span>
            </div>
            <button @click="resultadoRegistro = null" class="btn btn-sm btn-outline-secondary mt-2">
              Descartar y reintentar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';
import { formatearMontoInput, actualizarMontoInput } from '@/utils/formatters';
import AppButton from '@/components/ui/AppButton.vue';

import { useSedes } from '@/utils/useSedes';

const { sedes: sedesDisponibles, sedesCargadas, sedesActivas, cargarSedes } = useSedes();

const students = ref([]);
const cargandoEstudiantes = ref(false);
const sedeSeleccionada = ref('');
const tipoClase = ref('GRUPAL');
const nivelClase = ref('');
const fechaAsistencia = ref('');

const gruposSedeSeleccionada = computed(() => {
  const sede = sedesDisponibles.value.find(s => s.id === sedeSeleccionada.value);
  return sede?.grupos || [];
});

// ============================================================
// WATCH UI: al cambiar sede, auto-seleccionar tipo GRUPAL
// y el primer grupo disponible
// ============================================================
watch(sedeSeleccionada, (nuevoId) => {
  tipoClase.value = 'GRUPAL';
  if (nuevoId) {
    const sede = sedesDisponibles.value.find(s => s.id === nuevoId);
    if (sede && sede.grupos && sede.grupos.length > 0) {
      const primerGrupoValido = sede.grupos.find(g => g && g.nombre && g.nombre.trim() !== '');
      nivelClase.value = primerGrupoValido ? primerGrupoValido.nombre : '';
    } else {
      nivelClase.value = '';
    }
  } else {
    nivelClase.value = '';
  }
});

// ============================================================
// WATCH REACTIVO UNIFICADO (Enfoque 1): Dispara petición HTTP
// cada vez que el usuario cambia sede, nivel o tipo de clase.
// Funciona para ADMIN y EMPLEADO por igual.
// GET /api/clientes/estudiantes?sedeId=X&nivel=Y
// El backend aplica el filtro a nivel BD (JOIN FETCH + WHERE)
// y para EMPLEADO añade restricción por sedes autorizadas.
// ============================================================
watch([sedeSeleccionada, nivelClase, tipoClase], async ([sedeId, nivel, tipo]) => {
  if (!sedeId) {
    students.value = [];
    return;
  }

  cargandoEstudiantes.value = true;
  try {
    const params = { sedeId };
    if (tipo === 'GRUPAL' && nivel) {
      // Reconstruir el nivel completo (emoji + nombre) como está en la BD
      // porque 'nivelClase' solo guarda grupo.nombre (ej. "Iniciación")
      // pero la columna 'enrollments.nivel' almacena "🌱 Iniciación".
      const grupo = gruposSedeSeleccionada.value.find(g => g.nombre === nivel);
      const nivelConEmoji = grupo
        ? `${grupo.emoji || ''} ${grupo.nombre}`.trim()
        : nivel;
      params.nivel = nivelConEmoji;
    }
    const response = await axios.get('/api/clientes/estudiantes', { params });
    if (!response?.data) { students.value = []; return; }

    students.value = response.data
      .filter(hijo => hijo.estado === 'ACTIVO')
      .map(hijo => ({
        ...hijo,
        presente: false,
        precioPersonalizado: null
      }))
      .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
  } catch (error) {
    console.error('Error cargando estudiantes:', error);
    students.value = [];
  } finally {
    cargandoEstudiantes.value = false;
  }
});

// ============================================================
// COMPUTED: identidad simple — el backend ya filtró por sede y nivel.
// Tanto ADMIN como EMPLEADO reciben datos ya filtrados desde la BD.
// ============================================================
const estudiantesFiltrados = computed(() => students.value);

const actualizarPrecioInput = (event, estudiante) => {
  actualizarMontoInput(event, estudiante, 'precioPersonalizado');
};

const cargarSedesYPreseleccionar = async () => {
  await cargarSedes();
  // Auto-seleccionar "Sede Principal" por defecto si existe
  const sedePrincipal = sedesDisponibles.value.find(s => s.nombre === 'Sede Principal');
  if (sedePrincipal) {
    sedeSeleccionada.value = sedePrincipal.id;
  }
};

const registrando = ref(false);
const resultadoRegistro = ref(null); // { exitosos: string[], fallidos: { nombre: string, error: string }[] }

const registrarAsistencias = async () => {
  const presentes = estudiantesFiltrados.value.filter(s => s.presente);
  if (presentes.length === 0) {
    alert("⚠️ Selecciona al menos un estudiante.");
    return;
  }

  if (!sedeSeleccionada.value) {
    alert("⚠️ Selecciona la sede de la clase.");
    return;
  }

  const nivelAEnviar = tipoClase.value === 'GRUPAL' ? nivelClase.value : null;
  registrando.value = true;
  resultadoRegistro.value = null;

  const results = await Promise.allSettled(presentes.map(est => {
    const params = {
      studentId: est.id,
      tipoClase: tipoClase.value,
      nivel: nivelAEnviar,
      fecha: fechaAsistencia.value,
      sedeId: sedeSeleccionada.value
    };
    let precioLimpio = null;
    if (est.precioPersonalizado != null && est.precioPersonalizado !== '') {
      const num = Number(est.precioPersonalizado);
      if (!isNaN(num) && num >= 0) {
        precioLimpio = num;
      }
    }
    if (precioLimpio !== null) {
      params.precioPersonalizado = precioLimpio;
    }
    return axios.post('/api/finanzas/asistencia', null, { params });
  }));

  registrando.value = false;

  const exitosos = [];
  const fallidos = [];

  results.forEach((r, i) => {
    const nombre = presentes[i].nombreCompleto;
    if (r.status === 'fulfilled') {
      exitosos.push(nombre);
    } else {
      fallidos.push({ nombre, error: r.reason?.response?.data || r.reason?.message || 'Error de conexión' });
    }
  });

  resultadoRegistro.value = { exitosos, fallidos };

  if (fallidos.length === 0) {
    students.value.forEach(s => { s.presente = false; s.precioPersonalizado = null; });
    fechaAsistencia.value = '';
  }
};

onMounted(() => {
  cargarSedesYPreseleccionar();
});
</script>

<style scoped>
/* Mobile: tarjetas de estudiantes en lugar de tabla */
.home-estudiante-card {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  margin-bottom: var(--space-2);
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.home-estudiante-card--selected {
  border-color: var(--orange-300);
  background: var(--orange-50);
}

.home-estudiante-card__left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
}

.home-estudiante-card__checkbox {
  flex-shrink: 0;
}

.home-estudiante-card__info {
  flex: 1;
}

.home-estudiante-card__name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--text-primary);
}

/* Footer actions responsive */
.home-footer-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-primary);
}

.home-footer-fecha {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.home-footer-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.home-footer-hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.home-footer-btn {
  width: 100%;
}

@media (min-width: 768px) {
  .home-footer-actions {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }

  .home-footer-fecha {
    width: 50%;
  }

  .home-footer-btn {
    width: auto;
  }
}
</style>