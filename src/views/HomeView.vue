<template>
  <div class="mt-4">
    <h3 class="mb-4">📋 Registrar Asistencia</h3>

    <!-- Bloqueo por sede inactiva -->
    <div v-if="sedesCargadas && sedesActivas.length === 0" class="card shadow-sm border-warning mb-4">
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
                       backgroundColor: tipoClase === 'GRUPAL' ? '#2563eb' : '#ffffff',
                       color: tipoClase === 'GRUPAL' ? '#ffffff' : '#2563eb',
                       borderColor: '#2563eb'
                     }">👥 Grupal</label>

              <input type="radio" class="btn-check" id="personalizada" value="PERSONALIZADA" v-model="tipoClase">
              <label class="btn px-4 fw-bold transition-all border" for="personalizada"
                     :style="{
                       backgroundColor: tipoClase === 'PERSONALIZADA' ? '#4f46e5' : '#ffffff',
                       color: tipoClase === 'PERSONALIZADA' ? '#ffffff' : '#4f46e5',
                       borderColor: '#4f46e5'
                     }">👤 Personalizada</label>
            </div>
          </div>
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
                         backgroundColor: nivelClase === grupo.nombre ? (grupo.colorHex || '#6b7280') : '#ffffff',
                         color: nivelClase === grupo.nombre ? '#ffffff' : (grupo.colorHex || '#6b7280'),
                         borderColor: grupo.colorHex || '#6b7280'
                       }">
                  {{ grupo.emoji ? grupo.emoji + ' ' : '' }}{{ grupo.nombre }}
                </label>
              </template>
            </template>
          </div>
        </div>

        <div class="table-responsive mt-3">
          <table class="table table-hover align-middle border">
            <thead class="table-light border-bottom border-dark">
              <tr>
                <th class="text-center" style="width: 10%;">Presente</th>
                <th :style="{ width: tipoClase === 'GRUPAL' ? '60%' : '70%' }">Estudiante</th>
                <th style="width: 150px;">Precio Especial ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="estudiante in estudiantesFiltrados" :key="estudiante.id">
                <td class="text-center">
                  <input class="form-check-input fs-4 border-secondary shadow-sm" type="checkbox" v-model="estudiante.presente">
                </td>
                <td class="fw-bold text-dark">{{ estudiante.nombreCompleto }}</td>
                <td>
                  <input type="text" class="form-control form-control-sm" :value="formatearMontoInput(estudiante.precioPersonalizado)" @input="actualizarPrecioInput($event, estudiante)" placeholder="Opcional" :disabled="!estudiante.presente">
                </td>
              </tr>
              <tr v-if="estudiantesFiltrados.length === 0">
                <td colspan="3" class="text-center text-muted py-5 bg-light rounded">
                  No hay estudiantes registrados en este nivel.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="d-flex justify-content-between align-items-end mt-4 pt-4 border-top">
          <div class="w-50 me-4">
            <label class="form-label text-dark fw-bold small mb-1">📅 Fecha de la clase (Opcional):</label>
            <input type="date" v-model="fechaAsistencia" class="form-control border-secondary shadow-sm">
            <small class="text-muted mt-1 d-block" style="font-size: 0.75rem;">Si lo dejas vacío, se usará la fecha de hoy.</small>
          </div>
          <button @click="registrarAsistencias" class="btn btn-success border border-2 border-dark px-4 py-2 fw-bold shadow">
            ✅ Registrar Asistencias
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';

const students = ref([]);
const sedesDisponibles = ref([]);
const sedesCargadas = ref(false);
const sedeSeleccionada = ref('');
const tipoClase = ref('GRUPAL');
const nivelClase = ref('');
const fechaAsistencia = ref('');

const sedesActivas = computed(() => sedesDisponibles.value.filter(s => s.activa !== false));

const gruposSedeSeleccionada = computed(() => {
  const sede = sedesDisponibles.value.find(s => s.id === sedeSeleccionada.value);
  return sede?.grupos || [];
});

// Al cambiar de sede, auto-seleccionar tipo GRUPAL y el primer grupo disponible
watch(sedeSeleccionada, (nuevoId) => {
  tipoClase.value = 'GRUPAL';
  if (nuevoId) {
    const sede = sedesDisponibles.value.find(s => s.id === nuevoId);
    if (sede && sede.grupos && sede.grupos.length > 0) {
      // Buscar el primer grupo con nombre valido (no vacio)
      const primerGrupoValido = sede.grupos.find(g => g && g.nombre && g.nombre.trim() !== '');
      nivelClase.value = primerGrupoValido ? primerGrupoValido.nombre : '';
    } else {
      nivelClase.value = '';
    }
  } else {
    nivelClase.value = '';
  }
});

const estudiantesFiltrados = computed(() => {
  let filtrados = students.value;
  // Filtrar por sede si hay una seleccionada
  if (sedeSeleccionada.value) {
    filtrados = filtrados.filter(s =>
      s.matriculas && s.matriculas.some(m => m.sede && m.sede.id === sedeSeleccionada.value)
    );
  }
  // Filtrar por grupo/nivel si hay seleccionado (compatible con y sin emoji)
  if (tipoClase.value === 'GRUPAL' && nivelClase.value) {
    filtrados = filtrados.filter(s =>
      s.matriculas && s.matriculas.some(m => m.nivel && m.nivel.includes(nivelClase.value))
    );
  }
  return filtrados;
});

const formatearMontoInput = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '';
  const soloDigitos = String(valor).replace(/\D/g, '');
  if (!soloDigitos) return '';
  return Number(soloDigitos).toLocaleString('es-CO');
};

const actualizarPrecioInput = (event, estudiante) => {
  // Limpieza segura: solo aplica replace si es string (event.target.value siempre lo es)
  const raw = (event.target.value || '').replace(/\D/g, '');
  estudiante.precioPersonalizado = raw ? Number(raw) : null;
};

const cargarEstudiantes = async () => {
  try {
    const response = await axios.get('/api/finanzas/padres');
    if (!response?.data) return;
    const allStudents = [];
    
    response.data.forEach(padre => {
      if ((padre.estado === 'ACTIVO' || !padre.estado) && padre.students) {
        padre.students.forEach(hijo => {
          if (hijo.estado === 'ACTIVO') {
            allStudents.push({
              ...hijo,
                  presente: false,
              precioPersonalizado: null
            });
          }
        });
      }
    });
    students.value = allStudents.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
  } catch (error) {
    console.error("Error cargando estudiantes:", error);
  }
};

const cargarSedes = async () => {
  try {
    const res = await axios.get('/api/sedes');
    sedesDisponibles.value = res.data;
    sedesCargadas.value = true;
    // Auto-seleccionar "Sede Principal" por defecto si existe
    const sedePrincipal = res.data.find(s => s.nombre === 'Sede Principal');
    if (sedePrincipal) {
      sedeSeleccionada.value = sedePrincipal.id;
    }
  } catch (e) {
    console.error('Error al cargar sedes:', e);
  }
};

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

  // DEBUG: verificar payload antes de enviar
  console.log('=== REGISTRAR ASISTENCIAS ===');
  console.log('tipoClase:', tipoClase.value);
  console.log('isPersonalizada:', tipoClase.value === 'PERSONALIZADA');
  console.log('nivel:', nivelAEnviar);
  console.log('sedeId:', sedeSeleccionada.value);
  console.log('presentes:', presentes.length, presentes.map(e => ({ id: e.id, name: e.nombreCompleto })));

  try {
    await Promise.all(presentes.map(est => {
      const params = {
        studentId: est.id,
        tipoClase: tipoClase.value,
        nivel: nivelAEnviar,
        fecha: fechaAsistencia.value,
        sedeId: sedeSeleccionada.value
      };
      console.log('Payload para', est.nombreCompleto, ':', JSON.stringify(params));
      // Limpieza defensiva: Number() maneja strings y números; isNaN filtra vacíos/inválidos
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

    alert("✅ Asistencias registradas con éxito.");
    
    students.value.forEach(s => { s.presente = false; s.precioPersonalizado = null; });
    fechaAsistencia.value = '';
  } catch (error) {
    console.error(error);
    alert("❌ Hubo un error al registrar las asistencias.");
  }
};

onMounted(() => {
  cargarEstudiantes();
  cargarSedes();
});
</script>