<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
      <h3 class="mb-0 mt-0 d-flex align-items-center gap-2 fw-bold" style="line-height: 1.2;">
        <span>👥</span> Gestión de Clientes y Perfiles
      </h3>
      <div v-if="esAdmin" class="d-flex align-items-center gap-2 flex-wrap">
        <button 
          v-if="ultimoBatchInfo" 
          class="btn btn-warning text-dark fw-bold d-flex align-items-center gap-2 shadow-sm"
          :disabled="deshaciendoBatch"
          @click="deshacerUltimoBatch"
          title="Revierte la última importación de Excel realizada"
        >
          <span v-if="deshaciendoBatch" class="spinner-border spinner-border-sm"></span>
          <span v-else>↩️ Deshacer Importación</span>
        </button>
        <button 
          class="btn btn-primary fw-bold d-flex align-items-center gap-2 shadow-sm"
          :disabled="exportando"
          @click="exportarExcel"
        >
          <span v-if="exportando" class="spinner-border spinner-border-sm"></span>
          <span v-else>📥 Exportar Excel</span>
        </button>
        <button 
          class="btn btn-success fw-bold d-flex align-items-center gap-2 shadow-sm"
          @click="mostrarModalExcel = true"
        >
          <span>📊</span> Importar Excel
        </button>
      </div>
    </div>

    <!-- Banner de notificación premium dismissible -->
    <div v-if="notificacion" class="alert d-flex align-items-center gap-3 shadow-sm alert-dismissible fade show border mb-4" :class="`alert-${notificacion.tipo}`" role="alert">
      <span style="font-size: 1.5rem;">{{ notificacion.tipo === 'success' ? '✅' : '⚠️' }}</span>
      <div>
        <strong class="d-block">{{ notificacion.titulo }}</strong>
        <small :class="notificacion.tipo === 'success' ? 'text-success-emphasis' : 'text-danger-emphasis'">{{ notificacion.mensaje }}</small>
      </div>
      <button type="button" class="btn-close" @click="notificacion = null" aria-label="Close"></button>
    </div>

    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <button class="nav-link fw-bold" :class="{ 'active': pestanaActual === 'ACTIVOS' }" @click="pestanaActual = 'ACTIVOS'">
          Clientes Activos
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link fw-bold" :class="{ 'active': pestanaActual === 'INACTIVOS' }" @click="pestanaActual = 'INACTIVOS'">
          Clientes Inactivos
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link fw-bold" :class="{ 'active': pestanaActual === 'CORTESIAS' }" @click="pestanaActual = 'CORTESIAS'">
          🎟 Cortesías <span v-if="padresCortesias.length" class="badge bg-warning text-dark ms-1">{{ padresCortesias.length }}</span>
        </button>
      </li>
    </ul>

    <!-- Barra de búsqueda en vivo + Botón de Filtros -->
    <div class="clientes-filtros">
      <input
        type="text"
        v-model="textoBusqueda"
        class="form-control"
        placeholder="🔍 Buscar por acudiente o deportista..."
      />
      <div class="clientes-filtro-btn-wrap">
        <button
          type="button"
          class="btn btn-outline-secondary fw-bold d-flex align-items-center gap-2"
          @click="mostrarPanelFiltro = !mostrarPanelFiltro"
        >
          🔧 Filtros
          <span v-if="hayFiltrosActivos" class="badge bg-primary rounded-pill">●</span>
        </button>

        <div v-if="mostrarPanelFiltro" class="clientes-filtro-panel card shadow-sm">
          <div class="card-body p-3">
            <div class="mb-2">
              <label class="form-label small fw-semibold">🏢 Sede</label>
              <select v-model="filtroSedeId" class="form-select form-select-sm">
                <option value="">Todas las sedes</option>
                <option v-for="s in sedes" :key="s.id" :value="s.id">{{ s.nombre }}</option>
              </select>
            </div>
            <div class="mb-2" v-if="pestanaActual === 'ACTIVOS'">
              <label class="form-label small fw-semibold">💰 Estado de pago</label>
              <select v-model="filtroEstadoPago" class="form-select form-select-sm">
                <option value="TODOS">Todos</option>
                <option value="DEBE">Deben</option>
                <option value="AL_DIA">Al día</option>
              </select>
            </div>
            <div class="form-check mb-2">
              <input type="checkbox" v-model="verTodosSinPaginar" id="ver-todos-check" class="form-check-input" />
              <label for="ver-todos-check" class="form-check-label small">Ver todos los clientes sin paginación</label>
            </div>
            <button class="btn btn-sm btn-outline-secondary w-100" @click="limpiarFiltrosPanel">🔄 Limpiar filtros</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensaje cuando la búsqueda no encuentra resultados -->
    <div v-if="textoBusqueda.trim() && padresFiltrados.length === 0" class="alert alert-info text-center">
      No se encontraron resultados para "<strong>{{ textoBusqueda }}</strong>"
    </div>

    <div v-if="pestanaActual === 'INACTIVOS'" class="alert" style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-md); padding: var(--space-3);">
      Aquí aparecen los acudientes marcados como INACTIVOS. Puedes editarlos para reactivarlos.
    </div>
    <div v-if="pestanaActual === 'CORTESIAS'" class="alert" style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-md); padding: var(--space-3);">
      🎟 Deportistas que tomaron una clase de cortesía y aún no están matriculados. Edítalos para completar su inscripción — no hace falta volver a registrarlos desde cero.
    </div>

    <div class="row mt-3 align-items-start">
      <div class="col-md-6 mb-4" v-for="padre in listaPaginada" :key="padre.id">
        <TarjetaCliente
          :padre="padre"
          :sedes="sedes"
          :esquema-cobro="esquemaCobro"
          :matricula-opcional="matriculaOpcional"
          :seguro-opcional="seguroOpcional"
          :activeFormType="currentOpenClientId === padre.id ? currentOpenFormType : null"
          :activeDeudasId="currentDeudasClientId"
          @recargar="cargarPadres"
          @toggleCardForm="onToggleCardForm"
          @toggleDeudas="onToggleDeudas"
          @notificar="setNotificacion"
        />
      </div>
      <div v-if="listaSegunTab.length === 0" class="text-muted mb-4">
        {{ pestanaActual === 'ACTIVOS' ? 'No hay clientes en esta categoría.' : (pestanaActual === 'INACTIVOS' ? 'No hay clientes inactivos.' : 'No hay cortesías pendientes de matricular.') }}
      </div>
    </div>

    <div v-if="!verTodosSinPaginar && totalPaginas > 1" class="d-flex justify-content-center align-items-center mt-3 mb-2 gap-2">
      <button @click="paginaActual--" :disabled="paginaActual === 1" class="btn btn-outline-primary btn-sm fw-bold px-3">
        ⬅ Anterior
      </button>
      <span class="fw-bold text-muted small">Página {{ paginaActual }} de {{ totalPaginas }}</span>
      <button @click="paginaActual++" :disabled="paginaActual === totalPaginas" class="btn btn-outline-primary btn-sm fw-bold px-3">
        Siguiente ➡
      </button>
    </div>

    <!-- Modal de Importación Excel -->
    <ImportarExcelModal 
      :show="mostrarModalExcel" 
      @close="mostrarModalExcel = false" 
      @importado="onExcelImportado" 
      @deshecho="onExcelDeshecho"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import TarjetaCliente from '../components/TarjetaCliente.vue';
import ImportarExcelModal from '../components/ImportarExcelModal.vue';
import { isAdmin } from '@/utils/auth';
import { useSedes } from '@/utils/useSedes';

const { sedes, cargarSedes } = useSedes();
const esAdmin = computed(() => isAdmin());

const padres = ref([]);
const pestanaActual = ref('ACTIVOS');
const textoBusqueda = ref('');

// Filtros de la pantalla de Clientes: viven únicamente en memoria del componente
// (no en localStorage/sessionStorage) para que se reinicien solos al recargar la
// página o al cerrar sesión y volver a entrar (el componente se remonta desde cero).
const filtroSedeId = ref('');
const filtroEstadoPago = ref('TODOS'); // 'TODOS' | 'DEBE' | 'AL_DIA'
const verTodosSinPaginar = ref(false);
const mostrarPanelFiltro = ref(false);
const paginaActual = ref(1);
const itemsPorPagina = 4;

const hayFiltrosActivos = computed(() =>
  !!filtroSedeId.value || filtroEstadoPago.value !== 'TODOS' || verTodosSinPaginar.value
);

const limpiarFiltrosPanel = () => {
  filtroSedeId.value = '';
  filtroEstadoPago.value = 'TODOS';
  verTodosSinPaginar.value = false;
};

const mostrarModalExcel = ref(false);
const exportando = ref(false);
const deshaciendoBatch = ref(false);

// Estado puramente en memoria: se resetea si se recarga la página o se navega a otra vista
const ultimoBatchInfo = ref(null);

const currentOpenClientId = ref(null);
const currentOpenFormType = ref(null); // 'abono', 'historial', o 'edit'
const currentDeudasClientId = ref(null);

const notificacion = ref(null);

const setNotificacion = ({ tipo, titulo, mensaje }) => {
  // Los banners de notificación duran persistentemente hasta dar clic en (X) o cambiar de vista
  notificacion.value = { tipo, titulo, mensaje };
};

const exportarExcel = async () => {
  exportando.value = true;
  try {
    const response = await axios.get('/api/clientes/exportar-excel', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'clientes_deportistas.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error('Error al exportar clientes a Excel:', err);
    setNotificacion({
      tipo: 'danger',
      titulo: 'Error al exportar',
      mensaje: 'No se pudo generar el archivo Excel de clientes.'
    });
  } finally {
    exportando.value = false;
  }
};

const onExcelImportado = (res) => {
  if (res && res.batchId) {
    ultimoBatchInfo.value = res;
  }
  setNotificacion({
    tipo: 'success',
    titulo: '¡Importación Completada!',
    mensaje: `Se crearon ${res.deportistasCreados} deportistas y ${res.padresCreados} acudientes.`
  });
  cargarPadres();
};

const onExcelDeshecho = (res) => {
  ultimoBatchInfo.value = null;
  setNotificacion({
    tipo: 'warning',
    titulo: '¡Importación Deshecha!',
    mensaje: res.mensaje || 'Se revirtieron los registros creados en el archivo Excel.'
  });
  cargarPadres();
};

const deshacerUltimoBatch = async () => {
  if (!confirm('¿Estás seguro de que deseas deshacer la última importación? Se eliminarán los deportistas y acudientes creados en ese archivo.')) return;

  deshaciendoBatch.value = true;
  try {
    const batchId = ultimoBatchInfo.value?.batchId || 'ultimo';
    const res = await axios.post(`/api/clientes/deshacer-importacion/${batchId}`);
    onExcelDeshecho(res.data);
  } catch (err) {
    console.error('Error al deshacer importación:', err);
    const errorMsg = err.response?.data?.error || err.response?.data?.mensaje || 'El lote ya fue revertido o no se encuentra en el sistema.';
    setNotificacion({
      tipo: 'danger',
      titulo: 'No se pudo deshacer',
      mensaje: errorMsg
    });
  } finally {
    deshaciendoBatch.value = false;
  }
};

// Si se hace clic en el mismo formulario del mismo cliente, se cierra.
const onToggleCardForm = ({ clientId, formType }) => {
  if (currentOpenClientId.value === clientId && currentOpenFormType.value === formType) {
    // Si ya estaba abierto, ciérralo (comportamiento de "toggle")
    currentOpenClientId.value = null;
    currentOpenFormType.value = null;
  } else {
    // Si no, abre este nuevo y colapsa los demás automáticamente.
    currentOpenClientId.value = clientId;
    currentOpenFormType.value = formType;
  }
};

// Acordeón para "Clases por Pagar": solo un cliente con deudas visibles a la vez
const onToggleDeudas = (clientId) => {
  if (currentDeudasClientId.value === clientId) {
    currentDeudasClientId.value = null;
  } else {
    currentDeudasClientId.value = clientId;
  }
};

// Filtro de búsqueda en vivo: busca por nombre de padre o de deportista
const padresFiltrados = computed(() => {
  let filtrados = padres.value;

  // Filtrar por sede
  if (filtroSedeId.value) {
    const sedeId = Number(filtroSedeId.value);
    filtrados = filtrados.filter(p =>
      p.students && p.students.some(hijo =>
        hijo.matriculas && hijo.matriculas.some(m => m.sede && m.sede.id === sedeId)
      )
    );
  }

  // Filtrar por texto de búsqueda
  const busqueda = textoBusqueda.value.toLowerCase().trim();
  if (busqueda) {
    filtrados = filtrados.filter(padre => {
      if (padre.nombreCompleto.toLowerCase().includes(busqueda)) return true;
      if (padre.students) {
        return padre.students.some(hijo =>
          hijo.nombreCompleto.toLowerCase().includes(busqueda)
        );
      }
      return false;
    });
  }

  return filtrados;
});

// Una familia es "pura cortesía" cuando NINGUNO de sus deportistas ha sido activado
// todavía (todos siguen en estado CORTESIA) — son prospectos, no clientes reales.
const esFamiliaCortesia = (padre) => {
  const hijos = padre.students || [];
  return hijos.length > 0 && hijos.every(h => h.estado === 'CORTESIA');
};

// Filtros Computados (ahora sobre la lista filtrada por búsqueda)
const padresActivos = computed(() => padresFiltrados.value.filter(p => (p.estado === 'ACTIVO' || !p.estado) && !esFamiliaCortesia(p)));
const padresInactivos = computed(() => padresFiltrados.value.filter(p => p.estado === 'INACTIVO' && !esFamiliaCortesia(p)));
const padresCortesias = computed(() => padresFiltrados.value.filter(esFamiliaCortesia));

const padresActivosConDeuda = computed(() => padresActivos.value.filter(p => p.deudaTotal - (p.saldoAbono || 0) > 0));
const padresActivosAlDia = computed(() => padresActivos.value.filter(p => p.deudaTotal - (p.saldoAbono || 0) <= 0));

// Lista combinada según el filtro de "estado de pago" (solo aplica a la pestaña Activos)
const listaActivosFiltrada = computed(() => {
  if (filtroEstadoPago.value === 'DEBE') return padresActivosConDeuda.value;
  if (filtroEstadoPago.value === 'AL_DIA') return padresActivosAlDia.value;
  return [...padresActivosConDeuda.value, ...padresActivosAlDia.value];
});

// Lista que corresponde a la pestaña actualmente seleccionada
const listaSegunTab = computed(() => {
  if (pestanaActual.value === 'INACTIVOS') return padresInactivos.value;
  if (pestanaActual.value === 'CORTESIAS') return padresCortesias.value;
  return listaActivosFiltrada.value;
});

const totalPaginas = computed(() => Math.max(1, Math.ceil(listaSegunTab.value.length / itemsPorPagina)));

// FASE 4 — Paginación al estilo "Historial de Asistencias": solo se renderizan 4
// tarjetas de cliente a la vez para reducir la carga de la vista. El checkbox
// "Ver todos sin paginación" permite al ADMIN traer la lista completa cuando la necesite.
const listaPaginada = computed(() => {
  if (verTodosSinPaginar.value) return listaSegunTab.value;
  const inicio = (paginaActual.value - 1) * itemsPorPagina;
  return listaSegunTab.value.slice(inicio, inicio + itemsPorPagina);
});

watch([pestanaActual, filtroSedeId, filtroEstadoPago, textoBusqueda, verTodosSinPaginar], () => {
  paginaActual.value = 1;
});



const cargarPadres = async () => {
  try {
    await cargarSedes(true);
    const response = await axios.get('/api/clientes');
    
    if (!response?.data) return;

    // Cargar todos los cargos extras de manera paralela para mayor performance
    const padresRaw = response.data;
    const cargosExtrasPromises = padresRaw.map(p =>
      axios.get(`/api/finanzas/cargos-extras/${p.id}`)
        .then(r => ({ parentId: p.id, extras: r.data || [] }))
        .catch(() => ({ parentId: p.id, extras: [] }))
    );
    const cargosExtrasResults = await Promise.all(cargosExtrasPromises);
    const cargosExtrasMap = {};
    cargosExtrasResults.forEach(({ parentId, extras }) => {
      cargosExtrasMap[parentId] = extras;
    });

    padres.value = padresRaw.map(padre => {
      // Deuda por clases no pagadas
      let deudaClases = 0;
      if (padre.students) {
        padre.students.forEach(hijo => {
          if (hijo.attendances) {
            hijo.attendances.forEach(clase => {
              if (!clase.clasePaga) deudaClases += clase.precioCobrado;
            });
          }
        });
      }
      // Deuda por cargos extras (matrícula, seguro)
      const extras = cargosExtrasMap[padre.id] || [];
      const deudaExtras = extras.reduce((sum, e) => sum + (Number(e.monto) || 0), 0);

      return {
        ...padre,
        deudaTotal: deudaClases + deudaExtras,
        deudaClases,
        cargosExtras: extras,
        estado: padre.estado || 'ACTIVO',
        nuevoAbono: '',
        metodoPago: 'TRANSFERENCIA'
      };
    });
  } catch (error) {
    console.error(error);
    setNotificacion({
      tipo: 'danger',
      titulo: 'Error al cargar clientes',
      mensaje: 'No se pudo cargar la lista de clientes. Intenta de nuevo.'
    });
  }
};


const esquemaCobro = ref('MENSUALIDAD');
// Un concepto (matrícula/seguro) solo se muestra como badge en la tarjeta cuando el club lo cobra
// pero NO es obligatorio — si es obligatorio aplica a todos y no aporta información marcarlo.
const matriculaOpcional = ref(false);
const seguroOpcional = ref(false);

const cargarConfigCobro = async () => {
  try {
    const res = await axios.get('/api/config/cobro');
    const config = res.data || {};
    esquemaCobro.value = config.esquemaCobro || 'MENSUALIDAD';
    matriculaOpcional.value = !!config.cobraMatricula && !config.matriculaObligatoria;
    seguroOpcional.value = !!config.cobraSeguro && !config.seguroObligatorio;
  } catch (e) {
    esquemaCobro.value = 'MENSUALIDAD';
    matriculaOpcional.value = false;
    seguroOpcional.value = false;
  }
};

onMounted(() => { cargarPadres(); cargarSedes(); cargarConfigCobro(); });
</script>

<style scoped>
.clientes-filtros {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.clientes-filtros .form-control,
.clientes-filtros .form-select {
  font-size: 0.875rem;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: var(--input-bg);
  color: var(--text-primary);
}

.clientes-filtros .form-control {
  flex: 1;
}

.clientes-filtro-btn-wrap {
  position: relative;
}

.clientes-filtro-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  width: 260px;
  z-index: 20;
  border: 1px solid var(--border-primary);
  background: var(--card-bg, #fff);
}

@media (max-width: 768px) {
  .clientes-filtros {
    flex-direction: column;
  }

  .clientes-filtro-panel {
    width: 100%;
    right: auto;
    left: 0;
  }
}
</style>