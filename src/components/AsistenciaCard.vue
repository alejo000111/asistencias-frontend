<template>
  <div class="card shadow-sm" style="padding: 0 !important; border-radius: 16px !important; overflow: hidden !important; border: 1px solid #e5e7eb; width: 100%; max-width: none; margin: 0;">
    <!-- Cabecera edge-to-edge con color dinámico del grupo -->
    <div class="text-white text-center w-100 p-2" :style="{ backgroundColor: grupo.color || '#10b981', margin: '0' }">
      <div class="fw-bold fs-6">{{ grupo.titulo }}</div>
      <div v-if="grupo.sede" class="m-0" style="font-size: 0.8rem; opacity: 0.75;">
        <span class="me-1">🏢</span>{{ grupo.sede }}
      </div>
    </div>

    <div class="card-body p-2 d-flex flex-column align-items-center gap-2">
      <h5 class="fw-bold fs-6 mb-0" style="color: #1f2937;">{{ grupo.fechaDisplay }}</h5>

      <div>
        <span v-if="grupo.pendientesCount > 0" class="badge px-3 py-1 fw-semibold" style="font-size: 0.75rem; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 20px;">
          🚨 {{ grupo.pendientesCount }} por pagar
        </span>
        <span v-else class="badge px-3 py-1 fw-semibold" style="font-size: 0.75rem; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 20px;">
          ✅ 100% Paga
        </span>
      </div>

      <button @click="emit('toggle', grupo.id)" class="btn btn-outline-secondary btn-sm w-100 fw-bold text-dark" style="border-radius: 8px;">
        {{ isOpen ? '⬆ Ocultar Deportistas' : '👀 Ver Deportistas (' + grupo.estudiantes.length + ')' }}
      </button>

      <div v-if="isOpen" class="text-start w-100" style="padding-top: 12px; border-top: 1px solid #f3f4f6;">
        <div v-if="alumnosPorPagar.length > 0" class="mb-2">
          <h6 class="text-danger fw-bold mb-1" style="font-size: 0.85rem;">❌ Por Pagar</h6>
          <ul class="list-group list-group-flush">
            <li v-for="(alumno, index) in alumnosPorPagar" :key="'deuda-'+index" class="list-group-item px-1 py-1 bg-transparent border-0 text-muted d-flex justify-content-between align-items-center flex-wrap gap-1">
              <div>
                • {{ alumno.nombre }}
                <span v-if="alumno.esCortesia" class="badge bg-warning text-dark fw-bold ms-1" style="font-size: 0.70rem;">🎟 Cortesía</span>
                <span v-if="alumno.esPrecioEspecial && !alumno.esCortesia" class="text-muted fw-semibold ms-1" style="font-size: 0.70rem;">(Precio Especial: ${{ formatearDinero(alumno.precioCobrado) }})</span>
                <span v-if="alumno.fueraDePlan" class="badge bg-danger text-white fw-bold ms-1" style="font-size: 0.70rem;" :title="alumno.motivoFueraDePlan || 'Superó la cuota de su plan/complemento'">⚠️ Fuera de plan</span>
              </div>
              <div class="d-flex align-items-center gap-1">
                <button
                  v-if="mostrarBotonDeshacer(alumno)"
                  @click="$emit('eliminarRegistro', alumno.idAsistencia)"
                  :disabled="!puedeDeshacer(alumno)"
                  class="btn btn-sm text-danger p-0"
                  :title="puedeDeshacer(alumno) ? 'Deshacer/quitar deportista' : 'Solo quien registró esta asistencia (o el admin) puede deshacerla'"
                >↩️</button>
              </div>
            </li>
          </ul>
        </div>

        <div v-if="alumnosPagos.length > 0">
          <h6 class="text-success fw-bold mb-1" style="font-size: 0.85rem;">✅ Clase Paga / Cortesía</h6>
          <ul class="list-group list-group-flush">
            <li v-for="(alumno, index) in alumnosPagos" :key="'paga-'+index" class="list-group-item px-1 py-1 bg-transparent border-0 text-muted d-flex justify-content-between align-items-center flex-wrap gap-1">
              <div>
                • {{ alumno.nombre }}
                <span v-if="alumno.esCortesia" class="badge bg-warning text-dark fw-bold ms-1" style="font-size: 0.70rem;">🎟 Cortesía</span>
                <span v-if="alumno.esPrecioEspecial && !alumno.esCortesia" class="text-muted fw-semibold ms-1" style="font-size: 0.70rem;">(Precio Especial: ${{ formatearDinero(alumno.precioCobrado) }})</span>
                <span v-if="alumno.fueraDePlan" class="badge bg-danger text-white fw-bold ms-1" style="font-size: 0.70rem;" :title="alumno.motivoFueraDePlan || 'Superó la cuota de su plan/complemento'">⚠️ Fuera de plan</span>
              </div>
              <div class="d-flex align-items-center gap-1">
                <button
                  v-if="mostrarBotonDeshacer(alumno)"
                  @click="$emit('eliminarRegistro', alumno.idAsistencia)"
                  :disabled="!puedeDeshacer(alumno)"
                  class="btn btn-sm text-danger p-0"
                  :title="puedeDeshacer(alumno) ? 'Deshacer/quitar deportista' : 'Solo quien registró esta asistencia (o el admin) puede deshacerla'"
                >↩️</button>
              </div>
            </li>
          </ul>
        </div>

        <div v-if="esAdmin || puedeDeshacerListaCompleta" class="mt-3 text-center" style="padding-top: 8px; border-top: 1px solid #f3f4f6;">
          <button @click="$emit('eliminarListaCompleta', grupo)" class="btn btn-outline-danger btn-sm w-100 fw-bold" style="border-radius: 8px;">
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
import { getAuthUserId } from '@/utils/auth';

const esAdmin = localStorage.getItem('authRole') === 'ADMIN';
const currentUserId = getAuthUserId();

const props = defineProps({
  grupo: { type: Object, required: true },
  isOpen: { type: Boolean, default: false }
});

const emit = defineEmits(['eliminarRegistro', 'eliminarListaCompleta', 'toggle', 'convertirCortesia']);

const alumnosPorPagar = computed(() => props.grupo.estudiantes.filter(e => !e.pagada));
const alumnosPagos = computed(() => props.grupo.estudiantes.filter(e => e.pagada));

// FASE 4 — Deshacer asistencia: el ADMIN puede deshacer cualquiera; un EMPLEADO
// solo puede deshacer las asistencias que él mismo registró. Otros entrenadores
// que vean el mismo historial (misma sede, distinto grupo/nivel) ven el botón
// deshabilitado en vez de oculto, para que quede claro que la acción existe
// pero no les pertenece.
function mostrarBotonDeshacer(alumno) {
  return esAdmin || !!alumno.registradoPorId;
}
function puedeDeshacer(alumno) {
  if (esAdmin) return true;
  return currentUserId != null && alumno.registradoPorId === currentUserId;
}
const puedeDeshacerListaCompleta = computed(() =>
  !esAdmin && props.grupo.estudiantes.length > 0 &&
  props.grupo.estudiantes.every(e => currentUserId != null && e.registradoPorId === currentUserId)
);
</script>

<style scoped>
/* No custom styles needed — all styles are handled by Bootstrap + inline */
</style>
