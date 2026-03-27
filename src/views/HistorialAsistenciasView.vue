<template>
  <div class="mt-4">
    <h3 class="mb-4">📅 Historial de Asistencias</h3>
    
    <div class="row">
      <div v-for="grupo in asistenciasPaginadas" :key="grupo.id" class="col-md-4 mb-3">
        <div class="card shadow-sm border-dark">
          
          <div class="card-header text-white fw-bold text-center" 
               :style="grupo.titulo.includes('PERSONALIZADA') ? 'background-color: #0d6efd;' : (grupo.titulo.includes('AVANZADA') ? 'background-color: #fd7e14;' : 'background-color: #198754;')">
            {{ grupo.titulo }}
          </div>
          
          <div class="card-body text-center">
            <h5 class="card-title text-dark mb-1">{{ grupo.fechaDisplay }}</h5>
            
            <div class="mb-3">
              <span v-if="grupo.pendientesCount > 0" class="badge bg-danger shadow-sm px-2 py-1" style="font-size: 0.8rem;">
                🚨 {{ grupo.pendientesCount }} por pagar
              </span>
              <span v-else class="badge bg-success shadow-sm px-2 py-1" style="font-size: 0.8rem;">
                ✅ 100% Paga
              </span>
            </div>
            
            <button @click="grupo.mostrar = !grupo.mostrar" class="btn btn-sm w-100 mb-2 fw-bold shadow-sm btn-ver-alumnos">
              {{ grupo.mostrar ? 'Ocultar Alumnos' : '👀 Ver Alumnos (' + grupo.estudiantes.length + ')' }}
            </button>
            
            <div v-if="grupo.mostrar" class="text-start mt-2 border-top pt-2 small">
              <div v-if="alumnosPorPagar(grupo.estudiantes).length > 0" class="mb-2">
                <h6 class="text-danger fw-bold mb-1" style="font-size: 0.85rem;">❌ Por Pagar</h6>
                <ul class="list-group list-group-flush">
                  <li v-for="(alumno, index) in alumnosPorPagar(grupo.estudiantes)" :key="'deuda-'+index" class="list-group-item px-1 py-1 bg-transparent border-0 text-muted d-flex justify-content-between align-items-center">
                    <div>
                      • {{ alumno.nombre }}
                      <span v-if="alumno.esMedia" class="text-dark fw-bold ms-1" style="font-size: 0.70rem;">(Media Clase)</span>
                    </div>
                    <button @click="eliminarRegistro(alumno.idAsistencia)" class="btn btn-sm text-danger p-0" title="Quitar alumno">✖</button>
                  </li>
                </ul>
              </div>

              <div v-if="alumnosPagos(grupo.estudiantes).length > 0">
                <h6 class="text-success fw-bold mb-1" style="font-size: 0.85rem;">✅ Clase Paga</h6>
                <ul class="list-group list-group-flush">
                  <li v-for="(alumno, index) in alumnosPagos(grupo.estudiantes)" :key="'paga-'+index" class="list-group-item px-1 py-1 bg-transparent border-0 text-muted d-flex justify-content-between align-items-center">
                    <div>
                      • {{ alumno.nombre }}
                      <span v-if="alumno.esMedia" class="text-dark fw-bold ms-1" style="font-size: 0.70rem;">(Media Clase)</span>
                    </div>
                    <button @click="eliminarRegistro(alumno.idAsistencia)" class="btn btn-sm text-danger p-0" title="Quitar alumno">✖</button>
                  </li>
                </ul>
              </div>

              <div class="mt-3 text-center border-top pt-2">
                <button @click="eliminarListaCompleta(grupo)" class="btn btn-outline-danger btn-sm w-100 fw-bold">
                  🗑️ Eliminar Lista Completa
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="asistenciasAgrupadas.length === 0" class="col-12 text-center text-muted mt-5">
        No hay registros de asistencias todavía.
      </div>
    </div>

    <div v-if="totalPaginas > 1" class="d-flex justify-content-center align-items-center mt-4 mb-5 gap-3">
      <button @click="paginaActual--" :disabled="paginaActual === 1" class="btn btn-outline-primary fw-bold px-4">
        ⬅ Anterior
      </button>
      <span class="fw-bold text-muted">Página {{ paginaActual }} de {{ totalPaginas }}</span>
      <button @click="paginaActual++" :disabled="paginaActual === totalPaginas" class="btn btn-outline-primary fw-bold px-4">
        Siguiente ➡
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const asistenciasAgrupadas = ref([]);

const paginaActual = ref(1);
const itemsPorPagina = 9; 

const totalPaginas = computed(() => Math.ceil(asistenciasAgrupadas.value.length / itemsPorPagina));

const asistenciasPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  return asistenciasAgrupadas.value.slice(inicio, fin);
});

const cargarAsistencias = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/finanzas/historial-asistencias');
    const raw = response.data;
    const grupos = {};
    
    raw.forEach(a => {
      let titulo = "⭐ PERSONALIZADA";
      if (a.nivel === "INICIACIÓN") titulo = "🌱 GRUPAL INICIACIÓN";
      if (a.nivel === "AVANZADO") titulo = "🔥 GRUPAL AVANZADA";

      const yyyy = Array.isArray(a.fecha) ? a.fecha[0] : new Date(a.fecha).getFullYear();
      const mm = Array.isArray(a.fecha) ? a.fecha[1] : new Date(a.fecha).getMonth() + 1;
      const dd = Array.isArray(a.fecha) ? a.fecha[2] : new Date(a.fecha).getDate();
      const hh = Array.isArray(a.fecha) ? (a.fecha[3] || 0) : new Date(a.fecha).getHours();
      const min = Array.isArray(a.fecha) ? (a.fecha[4] || 0) : new Date(a.fecha).getMinutes();

      const key = `${yyyy}-${mm}-${dd}-${hh}-${min}-${titulo}`;

      if (!grupos[key]) {
        grupos[key] = {
          id: key,
          tiempoMs: new Date(yyyy, mm - 1, dd, hh, min).getTime(),
          fechaDisplay: formatearFechaDisplay(a.fecha),
          titulo: titulo,
          estudiantes: [],
          mostrar: false,
          pendientesCount: 0 // Lo inicializamos en 0
        };
      }
      
      if (a.student) {
        // Si el estudiante existe, usamos su nombre normal
        grupos[key].estudiantes.push({
          idAsistencia: a.id,
          nombre: a.student.nombreCompleto,
          pagada: a.clasePaga,
          esMedia: a.esMediaClase === true
        });
      } else {
        // SI EL ESTUDIANTE FUE ELIMINADO (a.student es null)
        // Usamos el nombre histórico que guardamos en la base de datos
        grupos[key].estudiantes.push({
          idAsistencia: a.id,
          nombre: (a.nombreEstudianteHistorico || "Estudiante") + " (Retirado)",
          pagada: a.clasePaga,
          esMedia: a.esMediaClase === true
        });
      }
    });

    const arrGrupos = Object.values(grupos);
    
    arrGrupos.forEach(g => {
      g.pendientesCount = g.estudiantes.filter(e => !e.pagada).length;
    });

    asistenciasAgrupadas.value = arrGrupos.sort((a, b) => {
      const aTieneDeuda = a.pendientesCount > 0;
      const bTieneDeuda = b.pendientesCount > 0;

      if (aTieneDeuda && !bTieneDeuda) return -1;

      if (!aTieneDeuda && bTieneDeuda) return 1;
      
      // Si ambos tienen deuda (o ambos están 100% pagos), gana el más reciente
      return b.tiempoMs - a.tiempoMs;
    });
    
    if (paginaActual.value > totalPaginas.value && totalPaginas.value > 0) {
      paginaActual.value = totalPaginas.value;
    }
  } catch (error) { console.error("Error:", error); }
};

const formatearFechaDisplay = (fechaDato) => {
  if (!fechaDato) return '';
  let yyyy, mm, dd;
  
  if (Array.isArray(fechaDato)) {
    yyyy = fechaDato[0]; 
    mm = fechaDato[1]; 
    dd = fechaDato[2];
  } else {
    const f = new Date(fechaDato);
    yyyy = f.getFullYear(); 
    mm = f.getMonth() + 1; 
    dd = f.getDate();
  }

  // Lista de meses para mostrar en texto
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const mesTexto = meses[mm - 1]; // mm - 1 porque los arrays empiezan en 0
  
  return `${String(dd).padStart(2, '0')} ${mesTexto} ${yyyy}`;
};

const alumnosPorPagar = (estudiantes) => estudiantes.filter(e => !e.pagada);
const alumnosPagos = (estudiantes) => estudiantes.filter(e => e.pagada);

const eliminarRegistro = async (idAsistencia) => {
  if (!confirm("¿Seguro que deseas quitar a este estudiante de esta clase?")) return;
  try {
    await axios.delete(`http://localhost:8080/api/finanzas/asistencia/${idAsistencia}`);
    cargarAsistencias(); 
  } catch (error) { alert("Error al eliminar."); }
};

const eliminarListaCompleta = async (grupo) => {
  if (!confirm("¿Seguro que deseas eliminar TODA esta lista de asistencia? Esto no se puede deshacer.")) return;
  try {
    await Promise.all(grupo.estudiantes.map(est => 
      axios.delete(`http://localhost:8080/api/finanzas/asistencia/${est.idAsistencia}`)
    ));
    cargarAsistencias();
  } catch (error) { alert("Error al eliminar la lista."); }
};

onMounted(() => { cargarAsistencias(); });
</script>

<style scoped>
.btn-ver-alumnos {
  background-color: #212529;
  color: white;
  border: 1px solid transparent;
  transition: all 0.2s ease-in-out;
}

.btn-ver-alumnos:hover {
  background-color: #495057;
  color: white;
  border: 1px solid #ced4da;
  transform: scale(1.01);
}

.btn-ver-alumnos:active {
  background-color: #000000;
  transform: scale(0.99);
}
</style>