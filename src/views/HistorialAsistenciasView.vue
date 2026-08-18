<template>
  <div>
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <h3 class="m-0">📅 Historial de Asistencias</h3>
      <button
        v-if="esAdmin"
        id="btn-exportar-excel"
        class="btn btn-success fw-bold d-flex align-items-center gap-2 shadow-sm"
        @click="exportarExcel"
        :disabled="exportando"
      >
        <span v-if="exportando" class="spinner-border spinner-border-sm" role="status"></span>
        <span>📥 Exportar Planilla (Excel)</span>
      </button>
    </div>

    <!-- Barra de Filtros -->
    <div class="card shadow-sm mb-3 border-secondary bg-light">
      <div class="card-body p-3">
        <div class="row g-2 align-items-end">
          <!-- Búsqueda por nombre -->
          <div class="col-12 col-md-3">
            <label class="form-label small fw-bold text-secondary mb-1">🔍 Buscar deportista:</label>
            <input
              type="text"
              v-model="searchQuery"
              class="form-control form-control-sm"
              placeholder="Nombre..."
            />
          </div>

          <!-- Filtro Sede -->
          <div class="col-12 col-md-3">
            <label class="form-label small fw-bold text-secondary mb-1">🏢 Sede:</label>
            <select v-model="sedeFilter" class="form-select form-select-sm">
              <option value="">Todas las sedes</option>
              <option v-for="s in sedes" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>

          <!-- Filtro Fecha Desde -->
          <div class="col-6 col-md-2">
            <label class="form-label small fw-bold text-secondary mb-1">📅 Desde:</label>
            <input type="date" v-model="fechaDesde" class="form-control form-control-sm" />
          </div>

          <!-- Filtro Fecha Hasta -->
          <div class="col-6 col-md-2">
            <label class="form-label small fw-bold text-secondary mb-1">📅 Hasta:</label>
            <input type="date" v-model="fechaHasta" class="form-control form-control-sm" />
          </div>

          <!-- Botón Limpiar Filtros -->
          <div class="col-12 col-md-2">
            <button
              class="btn btn-outline-secondary btn-sm w-100 fw-bold"
              @click="limpiarFiltros"
              title="Limpiar todos los filtros"
            >
              🔄 Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row g-3 mt-1 align-items-start">
      <div v-for="grupo in asistenciasPaginadas" :key="grupo.id" class="col-12 col-md-6 col-lg-4">
        <AsistenciaCard
          :grupo="grupo"
          :is-open="tarjetaAbiertaId === grupo.id"
          @toggle="id => tarjetaAbiertaId = (tarjetaAbiertaId === id ? null : id)"
          @eliminarRegistro="eliminarRegistro"
          @eliminarListaCompleta="eliminarListaCompleta"
        />
      </div>

      <div v-if="asistenciasAgrupadas.length === 0" class="col-12 text-center text-muted mt-5 py-4">
        No hay registros de asistencias que coincidan con los filtros.
      </div>
    </div>

    <div v-if="totalPaginas > 1" class="d-flex justify-content-center align-items-center mt-3 mb-2 gap-2">
      <button @click="paginaActual--" :disabled="paginaActual === 1" class="btn btn-outline-primary btn-sm fw-bold px-3">
        ⬅ Anterior
      </button>
      <span class="fw-bold text-muted small">Página {{ paginaActual }} de {{ totalPaginas }}</span>
      <button @click="paginaActual++" :disabled="paginaActual === totalPaginas" class="btn btn-outline-primary btn-sm fw-bold px-3">
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
import { useSedes } from '@/utils/useSedes';

const tarjetaAbiertaId = ref(null);

const searchQuery = ref('');
const sedeFilter = ref('');
const fechaDesde = ref('');
const fechaHasta = ref('');

const rawAsistencias = ref([]);
const precios = ref({ grupal: 40000, personalizada: 50000 });
// "Precio Especial" solo tiene sentido en esquema Por Clase (ahí sí hay un precio base grupal/
// personalizada con el que comparar) — en Mensualidad y Paquete el precioCobrado de la asistencia
// no se compara contra esos precios, así que la etiqueta no debe aparecer en esos esquemas.
const esquemaCobro = ref('MENSUALIDAD');
const EMOJI_COLOR_MAP = { '🌱': '#059669', '🔥': '#ea580c', '⭐': '#0d6efd', '💪': '#7c3aed', '⚡': '#ca8a04', '🎯': '#dc2626', '🚀': '#0891b2', '💎': '#9333ea', '🌈': '#d946ef', '🦁': '#d97706' };

const { sedes, cargarSedes } = useSedes();

const paginaActual = ref(1);
const itemsPorPagina = 9;

const esAdmin = computed(() => {
  const role = localStorage.getItem('authRole');
  return role === 'ADMIN' || role === 'SUPERADMIN';
});

const limpiarFiltros = () => {
  searchQuery.value = '';
  sedeFilter.value = '';
  fechaDesde.value = '';
  fechaHasta.value = '';
  paginaActual.value = 1;
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
  const filterSedeId = sedeFilter.value ? Number(sedeFilter.value) : null;
  const desdeMs = fechaDesde.value ? new Date(fechaDesde.value + 'T00:00:00').getTime() : null;
  const hastaMs = fechaHasta.value ? new Date(fechaHasta.value + 'T23:59:59').getTime() : null;

  let datos = raw;

  // Filtro por nombre
  if (busqueda) {
    datos = datos.filter(a => {
      const nombre = a.nombreEstudiante || a.nombreEstudianteHistorico || '';
      return nombre.toLowerCase().includes(busqueda);
    });
  }

  // Filtro por Sede
  if (filterSedeId) {
    datos = datos.filter(a => a.sedeId === filterSedeId);
  }

  // Filtro por Rango de Fechas
  if (desdeMs || hastaMs) {
    datos = datos.filter(a => {
      if (!a.fecha) return false;
      const fDate = Array.isArray(a.fecha)
        ? new Date(a.fecha[0], a.fecha[1] - 1, a.fecha[2]).getTime()
        : new Date(a.fecha).getTime();
      if (desdeMs && fDate < desdeMs) return false;
      if (hastaMs && fDate > hastaMs) return false;
      return true;
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
      const info = getGrupoInfo(nivelLimpio, a.sedeId);
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
        titulo, color, sede: a.sedeNombre || null,
        estudiantes: [], pendientesCount: 0
      };
    }

    const pGrupal = Number(precios.value.grupal || 40000);
    const pPersonalizada = Number(precios.value.personalizada || 50000);
    const precio = Number(a.precioCobrado);
    const esPrecioEspecial = esquemaCobro.value === 'POR_CLASE' && ![pGrupal, pPersonalizada].includes(precio);

    grupos[key].estudiantes.push({
      idAsistencia: a.id,
      studentId: a.studentId || null,
      nombre: a.nombreEstudiante || a.nombreEstudianteHistorico || "Estudiante retirado",
      pagada: a.clasePaga,
      precioCobrado: precio,
      esPrecioEspecial,
      esCortesia: Boolean(a.esCortesia),
      fueraDePlan: Boolean(a.fueraDePlan),
      motivoFueraDePlan: a.motivoFueraDePlan || null,
      telefonoAcudienteCortesia: a.telefonoAcudienteCortesia,
      sedeId: a.sedeId,
      nivel: a.nivel,
      registradoPorId: a.registradoPorId,
      registradoPorNombre: a.registradoPorNombre
    });
  });

  return Object.values(grupos).map(g => {
    g.pendientesCount = g.estudiantes.filter(e => !e.pagada).length;
    return g;
  }).sort((a, b) => b.tiempoMs - a.tiempoMs); // más reciente (fecha más alta) primero, sin importar si tiene pendientes de pago
});

const totalPaginas = computed(() => Math.ceil(asistenciasAgrupadas.value.length / itemsPorPagina));

const asistenciasPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * itemsPorPagina;
  return asistenciasAgrupadas.value.slice(inicio, inicio + itemsPorPagina);
});

watch([searchQuery, sedeFilter, fechaDesde, fechaHasta], () => { paginaActual.value = 1; });

const cargarAsistencias = async () => {
  try {
    const response = await axios.get('/api/finanzas/historial-asistencias');
    rawAsistencias.value = response.data;
  } catch (error) { console.error("Error:", error); }
};

const cargarPrecios = async () => {
  try {
    const res = await axios.get('/api/public/precios');
    precios.value = res.data;
  } catch (e) { console.error('Error cargando precios:', e); }
};

const cargarEsquemaCobro = async () => {
  try {
    const res = await axios.get('/api/config/cobro');
    esquemaCobro.value = res.data?.esquemaCobro || 'MENSUALIDAD';
  } catch (e) { esquemaCobro.value = 'MENSUALIDAD'; }
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

// ═══════════════════════════════════════════════════════════════════════════
// FASE 3 — EXPORTACIÓN DE PLANILLA A EXCEL
// ═══════════════════════════════════════════════════════════════════════════
const exportando = ref(false);

const exportarExcel = async () => {
  exportando.value = true;
  try {
    const params = {};
    if (sedeFilter.value) params.sedeId = sedeFilter.value;
    if (fechaDesde.value) params.fechaDesde = fechaDesde.value;
    if (fechaHasta.value) params.fechaHasta = fechaHasta.value;

    const response = await axios.get('/api/finanzas/exportar-asistencias', {
      params,
      responseType: 'blob'
    });

    const disposition = response.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : 'planilla_asistencias.xlsx';

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Error al exportar Excel:", e);
    alert("❌ Error al exportar la planilla en Excel.");
  } finally {
    exportando.value = false;
  }
};

onMounted(() => { cargarAsistencias(); cargarSedes(); cargarPrecios(); cargarEsquemaCobro(); });
</script>