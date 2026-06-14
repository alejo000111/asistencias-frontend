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
      <AsistenciaCard
        v-for="grupo in asistenciasPaginadas"
        :key="grupo.id"
        :grupo="grupo"
        :expandido="!!gruposExpandidos[grupo.id]"
        class="col-md-4 mb-3"
        @toggle="toggleGrupo"
        @eliminarRegistro="eliminarRegistro"
        @eliminarListaCompleta="eliminarListaCompleta"
      />

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
import { formatearFecha } from '@/utils/formatters';
import AsistenciaCard from '@/components/AsistenciaCard.vue';

const searchQuery = ref('');
const rawAsistencias = ref([]);
const EMOJI_COLOR_MAP = { '🌱': '#059669', '🔥': '#ea580c', '⭐': '#0d6efd', '💪': '#7c3aed', '⚡': '#ca8a04', '🎯': '#dc2626', '🚀': '#0891b2', '💎': '#9333ea', '🌈': '#d946ef', '🦁': '#d97706' };

const sedes = ref([]);

const paginaActual = ref(1);
const itemsPorPagina = 9;

const gruposExpandidos = ref({});

const toggleGrupo = (id) => {
  if (gruposExpandidos.value[id]) {
    gruposExpandidos.value = {};
  } else {
    gruposExpandidos.value = { [id]: true };
  }
};

const getGrupoInfo = (nivel, sedeId) => {
  const fallback = { emoji: '', colorHex: '#10b981' };
  if (!nivel) return fallback;

  if (sedeId && sedes.value.length > 0) {
    const sedeData = sedes.value.find(s => s.id === sedeId);
    if (sedeData && sedeData.grupos) {
      let grupo = sedeData.grupos.find(g => g.nombre === nivel);
      if (!grupo) grupo = sedeData.grupos.find(g => (g.emoji + ' ' + g.nombre) === nivel);
      if (grupo) return { emoji: grupo.emoji || '', colorHex: grupo.colorHex || '#10b981' };
    }
  }

  const firstChar = nivel.trim().charAt(0);
  const colorFallback = EMOJI_COLOR_MAP[firstChar] || '#10b981';
  return { emoji: firstChar, colorHex: colorFallback };
};

const asistenciasAgrupadas = computed(() => {
  const raw = rawAsistencias.value;
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
    let titulo, color;
    if (a.tipoClase === "PERSONALIZADA" && !a.nivel) {
      titulo = "⭐ PERSONALIZADA";
      color = '#0d6efd';
    } else if (a.nivel) {
      const nivelLimpio = a.nivel.trim();
      const info = getGrupoInfo(nivelLimpio, a.sede?.id);
      if (nivelLimpio.startsWith('⭐')) {
        titulo = nivelLimpio;
      } else if (info.emoji && nivelLimpio.startsWith(info.emoji)) {
        titulo = 'GRUPAL ' + nivelLimpio;
      } else {
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
        id: key, tiempoMs: new Date(yyyy, mm - 1, dd, hh, min).getTime(),
        fechaDisplay: formatearFecha(a.fecha),
        titulo, color, sede: a.sede?.nombre || null,
        estudiantes: [], pendientesCount: 0
      };
    }

    const PRECIO_GRUPAL = 40000, PRECIO_PERSONALIZADA = 50000;
    const precio = Number(a.precioCobrado);
    const esPrecioEspecial = ![PRECIO_GRUPAL, PRECIO_PERSONALIZADA].includes(precio);

    grupos[key].estudiantes.push({
      idAsistencia: a.id,
      nombre: a.student ? a.student.nombreCompleto : (a.nombreEstudianteHistorico || "Estudiante") + " (Retirado)",
      pagada: a.clasePaga, precioCobrado: precio, esPrecioEspecial
    });
  });

  return Object.values(grupos).map(g => {
    g.pendientesCount = g.estudiantes.filter(e => !e.pagada).length;
    return g;
  }).sort((a, b) => {
    if (a.pendientesCount > 0 && b.pendientesCount === 0) return -1;
    if (a.pendientesCount === 0 && b.pendientesCount > 0) return 1;
    return b.tiempoMs - a.tiempoMs;
  });
});

const totalPaginas = computed(() => Math.ceil(asistenciasAgrupadas.value.length / itemsPorPagina));

const asistenciasPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * itemsPorPagina;
  return asistenciasAgrupadas.value.slice(inicio, inicio + itemsPorPagina);
});

watch(searchQuery, () => { paginaActual.value = 1; });

const cargarAsistencias = async () => {
  try {
    const response = await axios.get('/api/finanzas/historial-asistencias');
    rawAsistencias.value = response.data;
  } catch (error) { console.error("Error:", error); }
};

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