<template>
  <div class="mt-4">
    <h3 class="mb-4">📋 Registrar Asistencia</h3>

    <div class="card shadow-sm border-secondary">
      <div class="card-body p-4">
        
        <div class="text-center mb-4">
          <label class="form-label fw-bold text-dark">Selecciona el Tipo de Clase:</label><br>
          <div class="btn-group shadow-sm" role="group">
            <input type="radio" class="btn-check" id="grupal" value="GRUPAL" v-model="tipoClase">
            <label class="btn btn-outline-primary px-4 fw-bold" for="grupal">👥 Grupal</label>

            <input type="radio" class="btn-check" id="personalizada" value="PERSONALIZADA" v-model="tipoClase">
            <label class="btn btn-outline-primary px-4 fw-bold" for="personalizada">👤 Personalizada</label>
          </div>
        </div>

        <div v-if="tipoClase === 'GRUPAL'" class="text-center mb-4">
          <label class="form-label fw-bold text-dark">Nivel del Grupo:</label><br>
          <div class="btn-group shadow-sm" role="group">
            <input type="radio" class="btn-check" id="iniciacion" value="INICIACIÓN" v-model="nivelClase">
            <label class="btn px-4 fw-bold transition-all" 
                   :style="nivelClase === 'INICIACIÓN' ? 'background-color: #10b981; color: white; border-color: #10b981;' : 'background-color: white; color: #10b981; border-color: #10b981;'" 
                   for="iniciacion">🌱 Iniciación</label>

            <input type="radio" class="btn-check" id="avanzado" value="AVANZADO" v-model="nivelClase">
            <label class="btn px-4 fw-bold transition-all" 
                   :style="nivelClase === 'AVANZADO' ? 'background-color: #f97316; color: white; border-color: #f97316;' : 'background-color: white; color: #f97316; border-color: #f97316;'" 
                   for="avanzado">🔥 Avanzado</label>
          </div>
        </div>

        <div class="table-responsive mt-3">
          <table class="table table-hover align-middle border">
            <thead class="table-light border-bottom border-dark">
              <tr>
                <th class="text-center" style="width: 15%;">Presente</th>
                <th :style="{ width: tipoClase === 'GRUPAL' ? '55%' : '85%' }">Estudiante</th>
                <th v-if="tipoClase === 'GRUPAL'" class="text-center" style="width: 30%;">Media Clase</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="estudiante in estudiantesFiltrados" :key="estudiante.id">
                <td class="text-center">
                  <input class="form-check-input fs-4 border-secondary shadow-sm" type="checkbox" v-model="estudiante.presente">
                </td>
                <td class="fw-bold text-dark">{{ estudiante.nombreCompleto }}</td>
                <td v-if="tipoClase === 'GRUPAL'" class="text-center">
                  <input class="form-check-input fs-5 border-secondary shadow-sm" type="checkbox" v-model="estudiante.esMediaClase" :disabled="!estudiante.presente">
                </td>
              </tr>
              <tr v-if="estudiantesFiltrados.length === 0">
                <td :colspan="tipoClase === 'GRUPAL' ? 3 : 2" class="text-center text-muted py-5 bg-light rounded">
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
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const students = ref([]);
const tipoClase = ref('GRUPAL');
const nivelClase = ref('INICIACIÓN');
const fechaAsistencia = ref('');

const estudiantesFiltrados = computed(() => {
  if (tipoClase.value === 'PERSONALIZADA') {
    return students.value; // Muestra todos
  }
  return students.value.filter(s => s.nivel === nivelClase.value); // Filtra por nivel
});

const cargarEstudiantes = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/finanzas/padres');
    const allStudents = [];
    
    response.data.forEach(padre => {
      if ((padre.estado === 'ACTIVO' || !padre.estado) && padre.students) {
        padre.students.forEach(hijo => {
          if (hijo.estado === 'ACTIVO') {
            allStudents.push({
              ...hijo,
              // Usamos el nivel del backend o "INICIACIÓN" por defecto
              nivel: hijo.nivel || 'INICIACIÓN', 
              presente: false,
              esMediaClase: false  
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

const registrarAsistencias = async () => {
  const presentes = estudiantesFiltrados.value.filter(s => s.presente);
  if (presentes.length === 0) {
    alert("⚠️ Selecciona al menos un estudiante.");
    return;
  }

  const nivelAEnviar = tipoClase.value === 'GRUPAL' ? nivelClase.value : null;

  try {
    await Promise.all(presentes.map(est => 
      axios.post('http://localhost:8080/api/finanzas/asistencia', null, {
        params: {
          studentId: est.id,
          tipoClase: tipoClase.value,
          esMediaClase: tipoClase.value === 'GRUPAL' ? est.esMediaClase : false,
          nivel: nivelAEnviar,
          fecha: fechaAsistencia.value
        }
      })
    ));

    alert("✅ Asistencias registradas con éxito.");
    
    students.value.forEach(s => { s.presente = false; s.esMediaClase = false; });
  } catch (error) {
    console.error(error);
    alert("❌ Hubo un error al registrar las asistencias.");
  }
};

onMounted(() => {
  cargarEstudiantes();
});
</script>