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
    </ul>

    <!-- Barra de búsqueda en vivo + Filtro por sede -->
    <div class="clientes-filtros">
      <input
        type="text"
        v-model="textoBusqueda"
        class="form-control"
        placeholder="🔍 Buscar por acudiente o deportista..."
      />
      <select v-model="filtroSedeId" class="form-select">
        <option value="">🏢 Todas las sedes</option>
        <option v-for="s in sedes" :key="s.id" :value="s.id">{{ s.nombre }}</option>
      </select>
    </div>

    <!-- Mensaje cuando la búsqueda no encuentra resultados -->
    <div v-if="textoBusqueda.trim() && padresFiltrados.length === 0" class="alert alert-info text-center">
      No se encontraron resultados para "<strong>{{ textoBusqueda }}</strong>"
    </div>

    <div v-if="pestanaActual === 'ACTIVOS'">
      <h5 class="border-bottom pb-2 mt-2" style="color: var(--text-primary);">Tienen saldos pendientes</h5>
      <div class="row mt-3 align-items-start">
        <div class="col-md-6 mb-4" v-for="padre in padresActivosConDeuda" :key="padre.id">
          <TarjetaCliente 
            :padre="padre" 
            :sedes="sedes"
            :activeFormType="currentOpenClientId === padre.id ? currentOpenFormType : null"
            :activeDeudasId="currentDeudasClientId"
            @recargar="cargarPadres" 
            @toggleCardForm="onToggleCardForm"
            @toggleDeudas="onToggleDeudas"
            @notificar="setNotificacion"
          />
        </div>
        <div v-if="padresActivosConDeuda.length === 0" class="text-muted mb-4">Nadie debe dinero. ¡Excelente!</div>
      </div>

      <h5 class="border-bottom pb-2 mt-4" style="color: var(--text-primary);">Al Día / Saldo a Favor</h5>
      <div class="row mt-3 align-items-start">
        <div class="col-md-6 mb-4" v-for="padre in padresActivosAlDia" :key="padre.id">
          <TarjetaCliente 
            :padre="padre" 
            :sedes="sedes"
            :activeFormType="currentOpenClientId === padre.id ? currentOpenFormType : null"
            :activeDeudasId="currentDeudasClientId"
            @recargar="cargarPadres" 
            @toggleCardForm="onToggleCardForm"
            @toggleDeudas="onToggleDeudas"
            @notificar="setNotificacion"
          />
        </div>
        <div v-if="padresActivosAlDia.length === 0" class="text-muted">No hay clientes en esta categoría.</div>
      </div>
    </div>

    <div v-if="pestanaActual === 'INACTIVOS'">
      <div class="alert" style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-md); padding: var(--space-3);">
        Aquí aparecen los acudientes marcados como INACTIVOS. Puedes editarlos para reactivarlos.
      </div>
      <div class="row mt-3 align-items-start">
        <div class="col-md-6 mb-4" v-for="padre in padresInactivos" :key="padre.id">
          <TarjetaCliente 
            :padre="padre" 
            :sedes="sedes"
            :activeFormType="currentOpenClientId === padre.id ? currentOpenFormType : null"
            :activeDeudasId="currentDeudasClientId"
            @recargar="cargarPadres" 
            @toggleCardForm="onToggleCardForm"
            @toggleDeudas="onToggleDeudas"
            @notificar="setNotificacion"
          />
        </div>
        <div v-if="padresInactivos.length === 0" class="text-muted">No hay clientes inactivos.</div>
      </div>
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
import { ref, computed, onMounted } from 'vue';
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
const filtroSedeId = ref('');

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
  if (!ultimoBatchInfo.value || !ultimoBatchInfo.value.batchId) return;
  if (!confirm('¿Estás seguro de que deseas deshacer la última importación? Se eliminarán los deportistas y acudientes creados en ese archivo.')) return;

  deshaciendoBatch.value = true;
  try {
    const res = await axios.post(`/api/clientes/deshacer-importacion/${ultimoBatchInfo.value.batchId}`);
    onExcelDeshecho(res.data);
  } catch (err) {
    console.error('Error al deshacer importación:', err);
    sessionStorage.removeItem('ultimoBatchInfo');
    ultimoBatchInfo.value = null;
    setNotificacion({
      tipo: 'danger',
      titulo: 'Lote no disponible',
      mensaje: 'El lote ya fue revertido o expiró por reinicio del servidor.'
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

// Filtros Computados (ahora sobre la lista filtrada por búsqueda)
const padresActivos = computed(() => padresFiltrados.value.filter(p => p.estado === 'ACTIVO' || !p.estado));
const padresInactivos = computed(() => padresFiltrados.value.filter(p => p.estado === 'INACTIVO'));

const padresActivosConDeuda = computed(() => padresActivos.value.filter(p => p.deudaTotal > 0));
const padresActivosAlDia = computed(() => padresActivos.value.filter(p => p.deudaTotal === 0));



const cargarPadres = async () => {
  try {
    // Usamos el endpoint /api/clientes que ya aplica el filtro por sedes
    // autorizadas para el rol EMPLEADO (ClienteController.listarClientes())
    const response = await axios.get('/api/clientes');
    
    if (!response?.data) return;
    padres.value = response.data.map(padre => {
      let deuda = 0;
      if (padre.students) {
        padre.students.forEach(hijo => {
          if (hijo.attendances) {
            hijo.attendances.forEach(clase => {
              if (!clase.clasePaga) deuda += clase.precioCobrado;
            });
          }
        });
      }
      return {
        ...padre,
        deudaTotal: deuda,
        estado: padre.estado || 'ACTIVO',
        nuevoAbono: '',
        metodoPago: 'TRANSFERENCIA'
      };
    });
  } catch (error) { console.error(error); }
};

onMounted(() => { cargarPadres(); cargarSedes(); });
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

.clientes-filtros .form-select {
  min-width: 160px;
  width: auto;
}

@media (max-width: 768px) {
  .clientes-filtros {
    flex-direction: column;
  }

  .clientes-filtros .form-select {
    width: 100%;
    min-width: unset;
  }
}
</style>