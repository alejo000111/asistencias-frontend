<template>
  <div class="mt-4">
    <h3 class="mb-4">📅 Historial de Asistencias</h3>

    <!-- Buscador por nombre de deportista -->
    <div class="mb-3">
      <input
        type="text"
        v-model="searchQuery"
        class="form-control shadow-sm border-secondary"
        placeholder="🔍 Buscar por nombre de deportista..."
      />
    </div>
    
    <div class="row">
      <div v-for="grupo in asistenciasPaginadas" :key="grupo.id" class="col-md-4 mb-3">
        <div class="card shadow-sm border-dark">
          
          <div class="card-header text-white fw-bold text-center py-2" 
               :style="{ backgroundColor: grupo.color }">
            <div>{{ grupo.titulo }}</div>
            <div v-if="grupo.sede" class="mt-1" style="font-size: 0.7rem; opacity: 0.9;">
              🏢 {{ grupo.sede }}
            </div>
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
            
            <button @click="toggleGrupo(grupo.id)" class="btn btn-sm w-100 mb-2 fw-bold shadow-sm btn-ver-alumnos">
              {{ gruposExpandidos[grupo.id] ? 'Ocultar Alumnos' : '👀 Ver Alumnos (' + grupo.estudiantes.length + ')' }}
            </button>
            
            <div v-if="gruposExpandidos[grupo.id]" class="text-start mt-2 border-top pt-2 small">
              <div v-if="alumnosPorPagar(grupo.estudiantes).length > 0" class="mb-2">
                <h6 class="text-danger fw-bold mb-1" style="font-size: 0.85rem;">❌ Por Pagar</h6>
                <ul class="list-group list-group-flush">
                  <li v-for="(alumno, index) in alumnosPorPagar(grupo.estudiantes)" :key="'deuda-'+index" class="list-group-item px-1 py-1 bg-transparent border-0 text-muted d-flex justify-content-between align-items-center">
                    <div>
                      • {{ alumno.nombre }}
                      <span v-if="alumno.esPrecioEspecial" class="text-muted fw-semibold ms-1" style="font-size: 0.70rem;">(Precio Especial: ${{ formatearMonto(alumno.precioCobrado) }})</span>
                    </div>
                    <button v-if="esAdmin" @click="eliminarRegistro(alumno.idAsistencia)" class="btn btn-sm text-danger p-0" title="Quitar alumno">✖</button>
                  </li>
                </ul>
              </div>

              <div v-if="alumnosPagos(grupo.estudiantes).length > 0">
                <h6 class="text-success fw-bold mb-1" style="font-size: 0.85rem;">✅ Clase Paga</h6>
                <ul class="list-group list-group-flush">
                  <li v-for="(alumno, index) in alumnosPagos(grupo.estudiantes)" :key="'paga-'+index" class="list-group-item px-1 py-1 bg-transparent border-0 text-muted d-flex justify-content-between align-items-center">
                    <div>
                      • {{ alumno.nombre }}
                      <span v-if="alumno.esPrecioEspecial" class="text-muted fw-semibold ms-1" style="font-size: 0.70rem;">(Precio Especial: ${{ formatearMonto(alumno.precioCobrado) }})</span>
                    </div>
                    <button v-if="esAdmin" @click="eliminarRegistro(alumno.idAsistencia)" class="btn btn-sm text-danger p-0" title="Quitar alumno">✖</button>
                  </li>
                </ul>
              </div>

              <div v-if="esAdmin" class="mt-3 text-center border-top pt-2">
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
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';

const esAdmin = localStorage.getItem('authRole') === 'ADMIN';

const searchQuery = ref('');
const rawAsistencias = ref([]);
const EMOJI_COLOR_MAP = { '🌱': '#059669', '🔥': '#ea580c', '⭐': '#0d6efd', '💪': '#7c3aed', '⚡': '#ca8a04', '🎯': '#dc2626', '🚀': '#0891b2', '💎': '#9333ea', '🌈': '#d946ef', '🦁': '#d97706' };

const sedes = ref([]);

const paginaActual = ref(1);
const itemsPorPagina = 9;

// Estado expandido de cada grupo (trackeado fuera del computed para mantener reactividad)
const gruposExpandidos = ref({});

const toggleGrupo = (id) => {
  if (gruposExpandidos.value[id]) {
    // Si ya está abierto, lo cierra
    gruposExpandidos.value = {};
  } else {
    // Cierra todos los demás y abre solo este
    gruposExpandidos.value = { [id]: true };
  }
};

// Función helper: busca emoji y color del grupo en las sedes cargadas
const getGrupoInfo = (nivel, sedeId) => {
  const fallback = { emoji: '', colorHex: '#10b981' };
  if (!nivel) return fallback;

  if (sedeId && sedes.value.length > 0) {
    const sedeData = sedes.value.find(s => s.id === sedeId);
    if (sedeData && sedeData.grupos) {
      // Buscar por nombre exacto (nuevo formato: "Iniciación")
      let grupo = sedeData.grupos.find(g => g.nombre === nivel);
      // Buscar con emoji (formato legacy: "🌱 Iniciación")
      if (!grupo) grupo = sedeData.grupos.find(g => (g.emoji + ' ' + g.nombre) === nivel);
      if (grupo) return { emoji: grupo.emoji || '', colorHex: grupo.colorHex || '#10b981' };
    }
  }

  // Fallback: extraer primer carácter del nivel
  const firstChar = nivel.trim().charAt(0);
  const colorFallback = EMOJI_COLOR_MAP[firstChar] || '#10b981';
  return { emoji: firstChar, colorHex: colorFallback };
};

// Agrupa y filtra las asistencias en un solo computed
const asistenciasAgrupadas = computed(() => {
  const raw = rawAsistencias.value;

  // Filtrar por nombre de deportista si hay búsqueda
  const busqueda = searchQuery.value.toLowerCase().trim();
  let datos = raw;
  if (busqueda) {
    datos = raw.filter(a => {
      const nombre = a.student ? a.student.nombreCompleto : (a.nombreEstudianteHistorico || '');
      return nombre.toLowerCase().includes(busqueda);
    });
  }

  const grupos = {};

  datos.forEach(a => {
    // Determinar tipo, emoji y color dinámicamente
    let titulo, color;
    if (a.tipoClase === "PERSONALIZADA" && !a.nivel) {
      titulo = "⭐ PERSONALIZADA";
      color = '#0d6efd';
    } else if (a.nivel) {
      const nivelLimpio = a.nivel.trim();
      const info = getGrupoInfo(nivelLimpio, a.sede?.id);
      // Título: si ya tiene emoji (legacy), usarlo directo; si no, anteponer el del grupo
      if (nivelLimpio.startsWith('⭐')) {
        titulo = nivelLimpio;
      } else if (info.emoji && nivelLimpio.startsWith(info.emoji)) {
        // Legacy: el nivel ya incluye el emoji al inicio
        titulo = 'GRUPAL ' + nivelLimpio;
      } else {
        // Nuevo formato: anteponer emoji del grupo
        titulo = (info.emoji ? info.emoji + ' ' : '') + 'GRUPAL ' + nivelLimpio;
      }
      color = info.colorHex;
    } else {
      titulo = "⭐ PERSONALIZADA";
      color = '#0d6efd';
    }

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
        color: color,
        sede: a.sede?.nombre || null,
        estudiantes: [],
        pendientesCount: 0
      };
    }

    const PRECIO_GRUPAL = 40000;
    const PRECIO_PERSONALIZADA = 50000;
    const precio = Number(a.precioCobrado);
    const esPrecioEspecial = ![PRECIO_GRUPAL, PRECIO_PERSONALIZADA].includes(precio);

    if (a.student) {
      grupos[key].estudiantes.push({
        idAsistencia: a.id,
        nombre: a.student.nombreCompleto,
        pagada: a.clasePaga,
        precioCobrado: precio,
        esPrecioEspecial: esPrecioEspecial
      });
    } else {
      grupos[key].estudiantes.push({
        idAsistencia: a.id,
        nombre: (a.nombreEstudianteHistorico || "Estudiante") + " (Retirado)",
        pagada: a.clasePaga,
        precioCobrado: precio,
        esPrecioEspecial: esPrecioEspecial
      });
    }
  });

  const arrGrupos = Object.values(grupos);

  arrGrupos.forEach(g => {
    g.pendientesCount = g.estudiantes.filter(e => !e.pagada).length;
  });

  const ordenados = arrGrupos.sort((a, b) => {
    const aTieneDeuda = a.pendientesCount > 0;
    const bTieneDeuda = b.pendientesCount > 0;

    if (aTieneDeuda && !bTieneDeuda) return -1;
    if (!aTieneDeuda && bTieneDeuda) return 1;

    return b.tiempoMs - a.tiempoMs;
  });

  // Resetear paginación si la búsqueda cambió
  return ordenados;
});

const totalPaginas = computed(() => Math.ceil(asistenciasAgrupadas.value.length / itemsPorPagina));

const asistenciasPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  return asistenciasAgrupadas.value.slice(inicio, fin);
});

// Resetear paginación al buscar
watch(searchQuery, () => {
  paginaActual.value = 1;
});

const cargarAsistencias = async () => {
  try {
    const response = await axios.get('/api/finanzas/historial-asistencias');
    rawAsistencias.value = response.data;
  } catch (error) { console.error("Error:", error); }
};

const formatearMonto = (valor) => {
  if (valor === null || valor === undefined) return '0';
  return Number(valor).toLocaleString('es-CO');
};

const formatearFechaDisplay = (fechaDato) => {
  if (!fechaDato) return '';
  if (Array.isArray(fechaDato)) {
    return new Date(Date.UTC(fechaDato[0], fechaDato[1] - 1, fechaDato[2])).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  return new Date(fechaDato).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

const alumnosPorPagar = (estudiantes) => estudiantes.filter(e => !e.pagada);
const alumnosPagos = (estudiantes) => estudiantes.filter(e => e.pagada);

const eliminarRegistro = async (idAsistencia) => {
  if (!confirm("¿Seguro que deseas quitar a este estudiante de esta clase?")) return;
  try {
    await axios.delete(`/api/finanzas/asistencia/${idAsistencia}`);
    cargarAsistencias(); 
  } catch (error) { alert("Error al eliminar."); }
};

const eliminarListaCompleta = async (grupo) => {
  if (!confirm("¿Seguro que deseas eliminar TODA esta lista de asistencia? Esto no se puede deshacer.")) return;
  try {
    await Promise.all(grupo.estudiantes.map(est => 
      axios.delete(`/api/finanzas/asistencia/${est.idAsistencia}`)
    ));
    cargarAsistencias();
  } catch (error) { alert("Error al eliminar la lista."); }
};

const cargarSedes = async () => {
  try {
    const res = await axios.get('/api/sedes');
    sedes.value = res.data;
  } catch (e) { console.error('Error cargando sedes:', e); }
};

onMounted(() => { cargarAsistencias(); cargarSedes(); });
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