<template>
  <div class="card shadow-sm border-dark">
    <div class="card-header text-white fw-bold text-center py-2" :style="{ backgroundColor: grupo.color }">
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

      <button @click="$emit('toggle', grupo.id)" class="btn btn-sm w-100 mb-2 fw-bold shadow-sm btn-ver-alumnos">
        {{ expandido ? 'Ocultar Alumnos' : '👀 Ver Alumnos (' + grupo.estudiantes.length + ')' }}
      </button>

      <div v-if="expandido" class="text-start mt-2 border-top pt-2 small">
        <div v-if="alumnosPorPagar.length > 0" class="mb-2">
          <h6 class="text-danger fw-bold mb-1" style="font-size: 0.85rem;">❌ Por Pagar</h6>
          <ul class="list-group list-group-flush">
            <li v-for="(alumno, index) in alumnosPorPagar" :key="'deuda-'+index" class="list-group-item px-1 py-1 bg-transparent border-0 text-muted d-flex justify-content-between align-items-center">
              <div>
                • {{ alumno.nombre }}
                <span v-if="alumno.esPrecioEspecial" class="text-muted fw-semibold ms-1" style="font-size: 0.70rem;">(Precio Especial: ${{ formatearDinero(alumno.precioCobrado) }})</span>
              </div>
              <button v-if="esAdmin" @click="$emit('eliminarRegistro', alumno.idAsistencia)" class="btn btn-sm text-danger p-0" title="Quitar alumno">✖</button>
            </li>
          </ul>
        </div>

        <div v-if="alumnosPagos.length > 0">
          <h6 class="text-success fw-bold mb-1" style="font-size: 0.85rem;">✅ Clase Paga</h6>
          <ul class="list-group list-group-flush">
            <li v-for="(alumno, index) in alumnosPagos" :key="'paga-'+index" class="list-group-item px-1 py-1 bg-transparent border-0 text-muted d-flex justify-content-between align-items-center">
              <div>
                • {{ alumno.nombre }}
                <span v-if="alumno.esPrecioEspecial" class="text-muted fw-semibold ms-1" style="font-size: 0.70rem;">(Precio Especial: ${{ formatearDinero(alumno.precioCobrado) }})</span>
              </div>
              <button v-if="esAdmin" @click="$emit('eliminarRegistro', alumno.idAsistencia)" class="btn btn-sm text-danger p-0" title="Quitar alumno">✖</button>
            </li>
          </ul>
        </div>

        <div v-if="esAdmin" class="mt-3 text-center border-top pt-2">
          <button @click="$emit('eliminarListaCompleta', grupo)" class="btn btn-outline-danger btn-sm w-100 fw-bold">
            🗑️ Eliminar Lista Completa
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatearDinero } from '@/utils/formatters';

const esAdmin = localStorage.getItem('authRole') === 'ADMIN';

const props = defineProps({
  grupo: { type: Object, required: true },
  expandido: { type: Boolean, default: false }
});

defineEmits(['toggle', 'eliminarRegistro', 'eliminarListaCompleta']);

const alumnosPorPagar = computed(() => props.grupo.estudiantes.filter(e => !e.pagada));
const alumnosPagos = computed(() => props.grupo.estudiantes.filter(e => e.pagada));
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
