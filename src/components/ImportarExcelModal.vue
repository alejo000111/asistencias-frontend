<template>
  <div v-if="show" class="modal-backdrop-custom d-flex align-items-center justify-content-center">
    <div class="modal-card shadow-lg p-4 rounded-4" style="max-width: 600px; width: 90%; background: var(--card-bg); color: var(--text-primary); border: 1px solid var(--border-primary);">
      
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
        <h4 class="m-0 fw-bold d-flex align-items-center gap-2">
          <span>📊</span> Importar Deportistas desde Excel
        </h4>
        <button type="button" class="btn-close" @click="cerrar" :disabled="cargando" aria-label="Close"></button>
      </div>

      <!-- Cuerpo / Explicación -->
      <p class="text-muted small mb-3">
        Agrega deportistas y acudientes en lote usando las sedes, grupos y planes que ya tienes configurados en el ERP <code>.xlsx</code>.
      </p>

      <!-- Botón descargar plantilla -->
      <div class="card mb-4 p-3 bg-body-tertiary border-0 rounded-3 d-flex flex-row align-items-center justify-content-between">
        <div>
          <strong class="d-block text-primary small">¿No tienes la plantilla?</strong>
          <span class="text-muted" style="font-size: 0.8rem;">Descarga nuestro formato de ejemplo estructurado</span>
        </div>
        <button @click="descargarPlantilla" class="btn btn-outline-primary btn-sm fw-semibold d-flex align-items-center gap-1" :disabled="descargandoPlantilla">
          <span v-if="descargandoPlantilla" class="spinner-border spinner-border-sm"></span>
          <span v-else>📥 Descargar Plantilla</span>
        </button>
      </div>

      <!-- Selector de Archivo -->
      <div class="mb-4">
        <label class="form-label fw-semibold small mb-2">Selecciona el archivo Excel (.xlsx):</label>
        <input 
          type="file" 
          ref="fileInput" 
          accept=".xlsx, .xls" 
          class="form-control" 
          :disabled="cargando"
          @change="onFileSelected"
        />
      </div>

      <!-- Resumen del Resultado de la Importación -->
      <div v-if="resultado" class="alert border mb-4 p-3 rounded-3" :class="deshecho ? 'alert-warning' : 'alert-success'">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="fw-bold m-0" :class="deshecho ? 'text-warning-emphasis' : 'text-success'">
            {{ deshecho ? '⚠️ Importación Deshecha' : '✅ Importación Finalizada' }}
          </h6>
          <button 
            v-if="!deshecho && resultado.batchId" 
            @click="deshacerImportacion" 
            class="btn btn-danger text-white btn-sm fw-bold d-flex align-items-center gap-1 shadow-sm"
            :disabled="deshaciendo"
          >
            <span v-if="deshaciendo" class="spinner-border spinner-border-sm"></span>
            <span>↩️ Deshacer Carga</span>
          </button>
        </div>

        <div class="d-flex flex-wrap gap-2 mb-2">
          <span class="badge bg-primary">Procesados: {{ resultado.totalProcesados }}</span>
          <span class="badge bg-success">Deportistas Creados: {{ resultado.deportistasCreados }}</span>
          <span class="badge bg-info text-dark">Acudientes Creados: {{ resultado.padresCreados }}</span>
          <span class="badge bg-secondary">Matrículas Creadas: {{ resultado.matriculasCreadas }}</span>
        </div>

        <div v-if="resultado.errores && resultado.errores.length > 0" class="mt-3">
          <strong class="text-danger small d-block mb-1">⚠️ Observaciones / Errores en filas:</strong>
          <ul class="text-danger small mb-0 ps-3 style-disc" style="max-height: 120px; overflow-y: auto;">
            <li v-for="(err, idx) in resultado.errores" :key="idx">{{ err }}</li>
          </ul>
        </div>
      </div>

      <!-- Mensaje de Error General -->
      <div v-if="errorMsg" class="alert alert-danger border mb-4 p-3 rounded-3">
        <div class="fw-bold small mb-1">⚠️ {{ errorMsg }}</div>

        <div v-if="erroresValidacion.length > 0" class="errores-import-list mt-2">
          <div v-for="grupo in erroresAgrupados" :key="grupo.hoja" class="errores-import-hoja">
            <div class="errores-import-hoja__titulo">
              📄 {{ grupo.hoja }} <span class="errores-import-hoja__count">{{ grupo.items.length }}</span>
            </div>
            <div v-for="(item, idx) in grupo.items" :key="idx" class="errores-import-item">
              <span v-if="item.fila" class="errores-import-item__fila">Fila {{ item.fila }}</span>
              <span class="errores-import-item__msg">{{ item.mensaje }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Acciones Modal -->
      <div class="d-flex justify-content-end gap-2 pt-2 border-top">
        <button type="button" class="btn btn-secondary px-4" @click="cerrar" :disabled="cargando || deshaciendo">
          {{ resultado ? 'Cerrar' : 'Cancelar' }}
        </button>
        <button 
          v-if="!resultado" 
          type="button" 
          class="btn btn-success px-4 fw-bold d-flex align-items-center gap-2" 
          :disabled="!archivoSeleccionado || cargando"
          @click="subirArchivo"
        >
          <span v-if="cargando" class="spinner-border spinner-border-sm"></span>
          <span>🚀 Procesar Importación</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { useSedes } from '@/utils/useSedes';

const { cargarSedes } = useSedes();

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'importado', 'deshecho']);

const fileInput = ref(null);
const archivoSeleccionado = ref(null);
const cargando = ref(false);
const descargandoPlantilla = ref(false);
const deshaciendo = ref(false);
const deshecho = ref(false);
const resultado = ref(null);
const errorMsg = ref('');
const erroresValidacion = ref([]);

// Agrupa "Hoja [X] Fila Y: mensaje" por hoja, para que el listado se lea como una tabla y no
// como un muro de texto. Los mensajes que no traen ese prefijo (ej. reglas entre varias filas,
// como "el deportista X tiene teléfonos distintos") van en un grupo "General".
const erroresAgrupados = computed(() => {
  const patron = /^Hoja \[(.+?)\] Fila (\d+): (.*)$/;
  const grupos = new Map();
  for (const err of erroresValidacion.value) {
    const m = err.match(patron);
    const hoja = m ? m[1] : 'General';
    const item = m ? { fila: m[2], mensaje: m[3] } : { fila: null, mensaje: err };
    if (!grupos.has(hoja)) grupos.set(hoja, []);
    grupos.get(hoja).push(item);
  }
  return Array.from(grupos.entries()).map(([hoja, items]) => ({ hoja, items }));
});

const onFileSelected = (e) => {
  const files = e.target.files;
  if (files && files.length > 0) {
    archivoSeleccionado.value = files[0];
    errorMsg.value = '';
    erroresValidacion.value = [];
  } else {
    archivoSeleccionado.value = null;
  }
};

const descargarPlantilla = async () => {
  descargandoPlantilla.value = true;
  try {
    const response = await axios.get('/api/clientes/plantilla-excel', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_deportistas.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error('Error al descargar la plantilla:', err);
    alert('No se pudo descargar la plantilla de ejemplo.');
  } finally {
    descargandoPlantilla.value = false;
  }
};

const subirArchivo = async () => {
  if (!archivoSeleccionado.value) return;

  cargando.value = true;
  errorMsg.value = '';
  erroresValidacion.value = [];
  resultado.value = null;

  const formData = new FormData();
  formData.append('file', archivoSeleccionado.value);

  try {
    const response = await axios.post('/api/clientes/importar-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    resultado.value = response.data;
    deshecho.value = false;
    await cargarSedes(true);
    emit('importado', response.data);
  } catch (err) {
    console.error('Error al importar Excel:', err);
    if (err.response && err.response.data && err.response.data.error) {
      errorMsg.value = err.response.data.error;
      erroresValidacion.value = Array.isArray(err.response.data.errores) ? err.response.data.errores : [];
    } else {
      errorMsg.value = 'Ocurrió un error inesperado al procesar el archivo Excel.';
    }
  } finally {
    cargando.value = false;
  }
};

const deshacerImportacion = async () => {
  if (!resultado.value || !resultado.value.batchId) return;
  if (!confirm('¿Estás seguro de que deseas deshacer esta importación? Se eliminarán los deportistas y acudientes creados en este archivo.')) return;

  deshaciendo.value = true;
  errorMsg.value = '';

  try {
    const res = await axios.post(`/api/clientes/deshacer-importacion/${resultado.value.batchId}`);
    deshecho.value = true;
    await cargarSedes(true);
    emit('deshecho', res.data);
  } catch (err) {
    console.error('Error al deshacer importación:', err);
    errorMsg.value = 'No se pudo deshacer la importación o el lote ya expiró.';
  } finally {
    deshaciendo.value = false;
  }
};

const cerrar = () => {
  archivoSeleccionado.value = null;
  resultado.value = null;
  deshecho.value = false;
  errorMsg.value = '';
  erroresValidacion.value = [];
  if (fileInput.value) fileInput.value.value = '';
  emit('close');
};
</script>

<style scoped>
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1050;
}

.modal-card {
  box-shadow: var(--shadow-xl);
}

.errores-import-list {
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.errores-import-hoja {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 8px 10px;
}

.errores-import-hoja__titulo {
  font-weight: 700;
  font-size: 0.82rem;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.errores-import-hoja__count {
  background: rgba(220, 53, 69, 0.25);
  border-radius: 10px;
  padding: 0 8px;
  font-size: 0.72rem;
  font-weight: 700;
}

.errores-import-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
  font-size: 0.82rem;
  line-height: 1.35;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.errores-import-item:first-of-type {
  border-top: none;
}

.errores-import-item__fila {
  flex-shrink: 0;
  font-weight: 700;
  font-size: 0.72rem;
  background: rgba(220, 53, 69, 0.2);
  border-radius: 6px;
  padding: 1px 7px;
  white-space: nowrap;
}

.errores-import-item__msg {
  opacity: 0.95;
}
</style>
