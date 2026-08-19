<template>
  <div class="tarjeta-cliente card-premium">
    <div class="tarjeta-cliente__header">
      <h5 class="tarjeta-cliente__title">{{ padre.nombreCompleto }}
        <button @click="copiarLink" class="tarjeta-cliente__btn-link">🔗 Copiar Link</button>
      </h5>
      <div class="tarjeta-cliente__badges">
        <!-- ESQUEMA: MENSUALIDAD -->
        <template v-if="esquemaCobro === 'MENSUALIDAD'">
          <span v-if="padre.deudaTotal - (padre.saldoAbono || 0) > 0" class="badge-premium badge-deuda">
            🔴 Mensualidad Pendiente
          </span>
          <span v-else class="badge-premium badge-abono">
            🟢 Al Día (Mensualidad)
          </span>
          <span v-if="padre.saldoAbono > 0" class="badge-premium badge-abono">
            Saldo Favor: ${{ formatearDinero(padre.saldoAbono) }}
          </span>
        </template>

        <!-- ESQUEMA: PAQUETE -->
        <template v-else-if="esquemaCobro === 'PAQUETE'">
          <span v-if="clasesDisponibles > 0" class="badge-premium badge-abono">
            🎟️ {{ clasesDisponibles }} Clases Disponibles
          </span>
          <span v-else class="badge-premium badge-deuda">
            ⚠️ {{ clasesDisponibles }} Clases Disponibles
          </span>
        </template>

        <!-- ESQUEMA: POR_CLASE -->
        <template v-else>
          <span v-if="padre.deudaTotal - (padre.saldoAbono || 0) > 0" class="badge-premium badge-deuda">
            Debe: ${{ formatearDinero(padre.deudaTotal - (padre.saldoAbono || 0)) }}
          </span>
          <span v-if="(padre.saldoAbono || 0) - padre.deudaTotal > 0" class="badge-premium badge-abono">
            Abono: ${{ formatearDinero((padre.saldoAbono || 0) - padre.deudaTotal) }}
          </span>
        </template>
      </div>
    </div>
    <div class="tarjeta-cliente__body">
      <p class="tarjeta-cliente__info"><strong>📞 Teléfono:</strong> {{ padre.telefono }}</p>
      <ul class="tarjeta-cliente__students">
        <li v-for="hijo in padre.students" :key="hijo.id" class="tarjeta-cliente__student">
          <span>
            🛼 {{ hijo.nombreCompleto }} <span v-if="hijo.edad != null" class="text-secondary">({{ hijo.edad }} años)</span>
            <span v-if="hijo.estado === 'CORTESIA'" class="badge bg-warning text-dark fw-bold ms-1" style="font-size: 0.7rem;">🎟 Cortesía</span>
            <span v-if="matriculaOpcional" class="badge fw-bold ms-1" :class="hijo.adquiereMatricula ? 'bg-success text-white' : 'bg-secondary-subtle text-secondary'" style="font-size: 0.7rem;">
              {{ hijo.adquiereMatricula ? '🎫 Matrícula activa' : '⚠️ Sin matrícula' }}
            </span>
            <span v-if="seguroOpcional" class="badge fw-bold ms-1" :class="hijo.adquiereSeguro ? 'bg-success text-white' : 'bg-secondary-subtle text-secondary'" style="font-size: 0.7rem;">
              {{ hijo.adquiereSeguro ? '🛡️ Seguro activo' : '⚠️ Sin seguro' }}
            </span>
            <span v-if="obtenerSedesDeHijo(hijo).length" class="tarjeta-cliente__sede-badge" title="Sede(s) del deportista">
              📍 {{ obtenerSedesDeHijo(hijo).join(', ') }}
            </span>
            <span v-else class="tarjeta-cliente__sede-badge tarjeta-cliente__sede-badge--vacio">Sin matrícula/sede</span>
          </span>
          <span v-if="hijo.estado === 'CORTESIA' && esAdmin" class="tarjeta-cliente__cortesia-acciones">
            <button @click="matricularCortesia(hijo)" class="tarjeta-cliente__btn-mini tarjeta-cliente__btn-mini--matricular">✅ Matricular</button>
            <button @click="eliminarCortesiaHijo(hijo)" class="tarjeta-cliente__btn-mini tarjeta-cliente__btn-mini--eliminar">🗑️ Eliminar</button>
          </span>
        </li>
      </ul>
      <hr class="tarjeta-cliente__divider">

      <div class="tarjeta-cliente__actions">
        <button v-if="puedeRegistrarPago && !esFamiliaCortesia"
                @click="$emit('toggleCardForm', { clientId: padre.id, formType: formTypeParaBoton }); $emit('toggleDeudas', null)"
                class="tarjeta-cliente__btn-accion"
                :disabled="padre.estado === 'INACTIVO'">
          {{ etiquetaBoton }}
        </button>
        <button @click="toggleHistorial(); $emit('toggleDeudas', null)"
                class="tarjeta-cliente__btn-accion">📄 Historial</button>
        <button @click="activarModoEdicion(); $emit('toggleDeudas', null)"
                class="tarjeta-cliente__btn-accion">⚙️ Editar</button>
      </div>
      <div v-if="padre.deudaTotal > 0" class="tarjeta-cliente__deudas">
        <button @click="toggleDeudas"
                class="tarjeta-cliente__btn-accion tarjeta-cliente__btn-full">
          {{ mostrarDeudas ? '⬆ Ocultar' : '💸 Ver Deudas Pendientes' }}
        </button>
        <div v-if="mostrarDeudas" class="tarjeta-cliente__deudas-list">
          <!-- Cargos extras: matrícula y seguro -->
          <div v-if="padre.cargosExtras && padre.cargosExtras.length > 0">
            <div class="deudas-seccion-titulo">Cargos pendientes</div>
            <ul>
              <li v-for="cargo in padre.cargosExtras" :key="'extra-'+cargo.id" class="tarjeta-cliente__deuda-item">
                <div>
                  <span class="fw-semibold text-dark">• {{ obtenerNombreDesdeConcepto(cargo.concepto) }}</span>
                  <br><small class="text-muted">{{ obtenerSoloConcepto(cargo.concepto) }} - {{ cargo.fecha ? cargo.fecha.substring(0,10) : '' }}</small>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge-premium" style="background: #fef3c7; color: #92400e; border:1px solid #fcd34d;">${{ formatearDinero(cargo.monto) }}</span>
                  <button v-if="esAdmin" @click="marcarCargoPagado(cargo.id)" class="btn-marcar-pagado" title="Marcar como pagado">✓ Pagado</button>
                </div>
              </li>
            </ul>
          </div>
          <!-- Clases por pagar -->
          <div v-if="listaDeudas.length > 0">
            <div v-if="padre.cargosExtras && padre.cargosExtras.length > 0" class="deudas-seccion-titulo">Clases sin pagar</div>
            <ul>
              <li v-for="deuda in listaDeudas" :key="deuda.id" class="tarjeta-cliente__deuda-item">
                <div>
                  <span class="fw-semibold">• {{ deuda.student?.nombreCompleto || deuda.nombreEstudianteHistorico || 'Deportista' }}</span>
                  <br><small class="text-muted">
                    {{ formatearFecha(deuda.fecha) }}
                    <template v-if="deuda.sedeNombre"> · {{ deuda.sedeNombre }}</template>
                    <template v-if="deuda.planNombre"> · Plan {{ deuda.planNombre }}</template>
                    <template v-if="deuda.tarifaLabel"> · Tarifa {{ deuda.tarifaLabel }}</template>
                  </small>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge-premium" style="background: var(--gray-200); color: var(--gray-800);">${{ formatearDinero(deuda.precioCobrado) }}</span>
                  <button v-if="esAdmin" @click="condonarDeudaClase(deuda.id)" class="btn-marcar-pagado" title="Marcar como pagado">✓ Pagado</button>
                </div>
              </li>
            </ul>
          </div>
          <div v-if="!listaDeudas.length && (!padre.cargosExtras || !padre.cargosExtras.length)" class="text-muted small text-center py-2">
            Sin deudas pendientes.
          </div>
        </div>
      </div>
    </div>
    <div v-show="activeFormType" class="tarjeta-cliente__panel">
      <AbonoForm v-if="activeFormType === 'abono'" :padre="padre" @recargar="$emit('recargar')" @cerrar="$emit('toggleCardForm', { clientId: padre.id, formType: null })" @notificar="e => $emit('notificar', e)" />
      <CompraPaqueteForm v-if="activeFormType === 'compraPaquete'" :padre="padre" @recargar="$emit('recargar')" @cerrar="$emit('toggleCardForm', { clientId: padre.id, formType: null })" @notificar="e => $emit('notificar', e)" />
      <HistorialForm v-if="activeFormType === 'historial'" :parent-id="padre.id" @recargar="$emit('recargar')" @notificar="e => $emit('notificar', e)" />
      <EditForm v-if="activeFormType === 'edit'" :padre="editPadre" :sedes="sedes" :es-cortesia="esFamiliaCortesia" @recargar="$emit('recargar')" @cancelar="cancelarEdicion" @notificar="e => $emit('notificar', e)" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { formatearFecha, formatearDinero } from '@/utils/formatters';
import AbonoForm from './AbonoForm.vue';
import CompraPaqueteForm from './CompraPaqueteForm.vue';
import HistorialForm from './HistorialForm.vue';
import EditForm from './EditForm.vue';

const props = defineProps(['padre', 'activeFormType', 'activeDeudasId', 'esquemaCobro', 'matriculaOpcional', 'seguroOpcional']);
const emit = defineEmits(['toggleCardForm', 'toggleDeudas', 'clienteActualizado', 'recargar', 'notificar']);

// existing code continues below


const etiquetaBoton = computed(() => {
  return props.esquemaCobro === 'PAQUETE' ? '📦 Compra de Paquete' : '💰 Abono';
});

const formTypeParaBoton = computed(() => {
  return props.esquemaCobro === 'PAQUETE' ? 'compraPaquete' : 'abono';
});

const clasesDisponibles = computed(() => {
  if (!props.padre || !props.padre.students) return 0;
  return props.padre.students.reduce((sum, h) => sum + (h.clasesDisponibles || 0), 0);
});

// Familia "pura cortesía": ninguno de sus deportistas ha sido inscrito todavía
const esFamiliaCortesia = computed(() => {
  const hijos = props.padre?.students || [];
  return hijos.length > 0 && hijos.every(h => h.estado === 'CORTESIA');
});

const matricularCortesia = async (hijo) => {
  if (!confirm(`¿Matricular a ${hijo.nombreCompleto} como deportista activo?`)) return;
  try {
    await axios.post(`/api/registro/cortesia/${hijo.id}/matricular`);
    emit('notificar', { tipo: 'success', titulo: 'Deportista Matriculado', mensaje: `${hijo.nombreCompleto} ya es un deportista activo.` });
    emit('recargar');
  } catch (e) {
    const msg = e.response?.data || e.message || 'Error al matricular.';
    emit('notificar', { tipo: 'danger', titulo: 'Error al Matricular', mensaje: typeof msg === 'string' ? msg : 'Error al matricular.' });
  }
};

const eliminarCortesiaHijo = async (hijo) => {
  if (!confirm(`¿Eliminar la cortesía de ${hijo.nombreCompleto}? Esta acción no se puede deshacer.`)) return;
  try {
    await axios.delete(`/api/registro/cortesia/${hijo.id}`);
    emit('notificar', { tipo: 'success', titulo: 'Cortesía Eliminada', mensaje: 'El prospecto fue eliminado del sistema.' });
    emit('recargar');
  } catch (e) {
    const msg = e.response?.data || e.message || 'Error al eliminar la cortesía.';
    emit('notificar', { tipo: 'danger', titulo: 'Error al Eliminar', mensaje: typeof msg === 'string' ? msg : 'Error al eliminar la cortesía.' });
  }
};

import { useSedes } from '@/utils/useSedes';
const { sedes, cargarSedes } = useSedes();

import { puedeRecaudarPagos } from '@/utils/auth';
const esAdmin = localStorage.getItem('authRole') === 'ADMIN';
// Un EMPLEADO con permiso de recaudación solo puede registrar abonos en efectivo,
// no compras de paquete (esa operación sigue siendo exclusiva de ADMIN en backend)
const puedeRegistrarPago = computed(() => esAdmin || (formTypeParaBoton.value === 'abono' && puedeRecaudarPagos()));
const editPadre = ref(null);
const listaDeudas = ref([]);

const limpiarConcepto = (concepto) => {
  if (!concepto) return 'Cargo pendiente';
  return concepto.replace(/\s*\(\$[^)]+\)\s*$/, '').trim();
};

const obtenerNombreDesdeConcepto = (concepto) => {
  const limpio = limpiarConcepto(concepto);
  const partes = limpio.split(' - ');
  if (partes.length > 1) {
    return partes[partes.length - 1].trim();
  }
  return 'Deportista';
};

const obtenerSoloConcepto = (concepto) => {
  const limpio = limpiarConcepto(concepto);
  const partes = limpio.split(' - ');
  if (partes.length > 1) {
    return partes.slice(0, -1).join(' - ').trim();
  }
  return limpio;
};

// Lista de nombres de sede (sin repetir) a las que pertenece el deportista, para mostrarla
// como una insignia clara junto a su nombre — antes solo aparecía como texto pequeño sin
// etiqueta debajo del nombre, mezclada con el nivel, y era fácil no notarla.
const obtenerSedesDeHijo = (hijo) => {
  if (!hijo.matriculas || hijo.matriculas.length === 0) return [];
  const nombres = hijo.matriculas
    .filter(m => m.sede && m.sede.activa !== false)
    .map(m => m.sede?.nombre)
    .filter(Boolean);
  return [...new Set(nombres)];
};

const mostrarDeudas = computed(() => props.activeDeudasId === props.padre.id);

const toggleDeudas = async () => {
  emit('toggleDeudas', props.padre.id);
  if (!mostrarDeudas.value) {
    emit('toggleCardForm', { clientId: props.padre.id, formType: null });
    try { 
      const r = await axios.get('/api/finanzas/deudas/' + props.padre.id); 
      listaDeudas.value = r.data; 
    }
    catch (e) { 
      console.error("Error cargando deudas:", e); 
    }
  }
};

const marcarCargoPagado = async (cargoId) => {
  if (!confirm('¿Confirmas que este cargo ya fue cobrado/pagado y deseas eliminarlo de los pendientes?')) return;
  try {
    await axios.delete(`/api/finanzas/cargo-extra/${cargoId}`);
    emit('recargar');
    emit('notificar', { tipo: 'success', titulo: 'Cargo Pagado', mensaje: 'El cargo fue marcado como pagado y eliminado de las deudas pendientes.' });
  } catch (e) {
    emit('notificar', { tipo: 'danger', titulo: 'Error', mensaje: 'No se pudo marcar el cargo como pagado.' });
  }
};

const condonarDeudaClase = async (attendanceId) => {
  if (!confirm('¿Confirmas que esta clase ya fue cobrada/pagada y deseas eliminarla de las deudas pendientes?')) return;
  try {
    await axios.delete(`/api/finanzas/deuda-clase/${attendanceId}`);
    listaDeudas.value = listaDeudas.value.filter(d => d.id !== attendanceId);
    emit('recargar');
    emit('notificar', { tipo: 'success', titulo: 'Deuda Eliminada', mensaje: 'La clase fue marcada como pagada y eliminada de las deudas pendientes.' });
  } catch (e) {
    emit('notificar', { tipo: 'danger', titulo: 'Error', mensaje: 'No se pudo eliminar la deuda de esta clase.' });
  }
};

const toggleHistorial = () => emit('toggleCardForm', { clientId: props.padre.id, formType: 'historial' });

const activarModoEdicion = async () => {
  await cargarSedes(true);
  // Crear copia local profunda para no mutar el prop
  editPadre.value = JSON.parse(JSON.stringify(props.padre));
  editPadre.value.editNombre = props.padre.nombreCompleto;
  editPadre.value.editTelefono = props.padre.telefono;
  editPadre.value.editEstado = props.padre.estado || 'ACTIVO';
  if (editPadre.value.students) {
    editPadre.value.students.forEach(hijo => {
      hijo.editNombre = hijo.nombreCompleto;
      hijo.editEdad = hijo.edad;
      // --- Corrección estricta de fecha ---
      let fechaRaw = hijo.fechaNacimiento;
      let fechaOk = '';
      if (fechaRaw) {
        if (Array.isArray(fechaRaw) && fechaRaw.length >= 3) {
          fechaOk = `${fechaRaw[0]}-${String(fechaRaw[1]).padStart(2, '0')}-${String(fechaRaw[2]).padStart(2, '0')}`;
        } else if (typeof fechaRaw === 'string' && fechaRaw.includes('T')) {
          fechaOk = fechaRaw.split('T')[0];
        } else if (typeof fechaRaw === 'string' && fechaRaw.includes('/')) {
          const partes = fechaRaw.split('/');
          if (partes.length === 3 && partes[2].length === 4) {
            fechaOk = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
          }
        } else if (typeof fechaRaw === 'string') {
          fechaOk = fechaRaw;
        }
      }
      hijo.editFechaNacimiento = fechaOk;
      const mats = hijo.matriculas || [];
      hijo.editSedeIds = mats.map(m => m.sede?.id).filter(id => id != null);
      hijo.editNiveles = {};
      mats.forEach(m => {
        if (m.sede?.id) {
          let valorNivel = m.nivel;
          const targetSede = sedes.value.find(s => s.id === m.sede.id);
          if (targetSede && targetSede.grupos) {
            const normNivel = (m.nivel || '').replace(/[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u26FF\u2700-\u27BF]/g, '').trim().toLowerCase();
            const matchG = targetSede.grupos.find(g => {
              const normG = (g.nombre || '').replace(/[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u26FF\u2700-\u27BF]/g, '').trim().toLowerCase();
              return normG === normNivel || (m.nivel && g.nombre && m.nivel.includes(g.nombre));
            });
            if (matchG) {
              valorNivel = (matchG.emoji ? matchG.emoji + ' ' : '') + matchG.nombre;
            }
          }
          hijo.editNiveles[m.sede.id] = valorNivel;
        }
      });
    });
  }
  emit('toggleCardForm', { clientId: props.padre.id, formType: 'edit' });
};

const cancelarEdicion = () => emit('toggleCardForm', { clientId: props.padre.id, formType: 'edit' });

const copiarLink = async () => {
  const url = window.location.origin + '/portal/' + props.padre.secretToken;
  try { 
    await navigator.clipboard.writeText(url); 
    emit('notificar', { tipo: 'success', titulo: 'Enlace Copiado', mensaje: 'El enlace del portal se ha copiado al portapapeles.' });
  }
  catch { 
    const ta = document.createElement('textarea'); 
    ta.value = url; 
    document.body.appendChild(ta); 
    ta.select(); 
    document.execCommand('copy'); 
    document.body.removeChild(ta); 
    emit('notificar', { tipo: 'success', titulo: 'Enlace Copiado', mensaje: 'El enlace del portal se ha copiado al portapapeles.' });
  }
};
</script>

<style scoped>
.tarjeta-cliente {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.tarjeta-cliente:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #d1d5db;
}

.tarjeta-cliente__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-primary);
}

/* Badge semántico: Deuda (rojo suave) */
.badge-deuda {
  background: #fef2f2 !important;
  color: #991b1b !important;
  border: 1px solid #fecaca !important;
  font-weight: 600;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 0.75rem;
}

/* Badge semántico: Abono (verde suave) */
.badge-abono {
  background: #ecfdf5 !important;
  color: #065f46 !important;
  border: 1px solid #a7f3d0 !important;
  font-weight: 600;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 0.75rem;
}

/* Botón de acción outline moderno */
.tarjeta-cliente__btn-accion {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;
}

.tarjeta-cliente__btn-accion:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.tarjeta-cliente__btn-accion:disabled {
  cursor: not-allowed;
}

.tarjeta-cliente__btn-full {
  width: 100%;
}

.tarjeta-cliente__cortesia-acciones {
  display: inline-flex;
  gap: 6px;
  margin-left: 8px;
  vertical-align: middle;
}

.tarjeta-cliente__btn-mini {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.tarjeta-cliente__btn-mini--matricular {
  background: #fff7ed;
  color: #9a3412;
  border: 1px solid #fdba74;
}
.tarjeta-cliente__btn-mini--matricular:hover {
  background: #ffedd5;
  border-color: #fb923c;
}

.tarjeta-cliente__btn-mini--eliminar {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.tarjeta-cliente__btn-mini--eliminar:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

/* Botón Copiar Link — etiqueta clickeable discreta */
.tarjeta-cliente__btn-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-700);
  background: var(--gray-100);
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all var(--transition-fast);
  white-space: nowrap;
  line-height: 1.4;
}

.tarjeta-cliente__btn-link:hover {
  background: var(--gray-200);
  border-color: var(--gray-400);
  color: var(--gray-900);
  transform: translateY(-1px);
}

.tarjeta-cliente__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.tarjeta-cliente__badges {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.tarjeta-cliente__body {
  padding: var(--space-3) var(--space-4);
}

.tarjeta-cliente__info {
  margin-bottom: var(--space-3);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.tarjeta-cliente__students {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-3) 0;
}

.tarjeta-cliente__student {
  padding: var(--space-1) 0;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.tarjeta-cliente__sede-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  background: var(--gray-100, #f1f5f9);
  color: var(--text-secondary);
}

.tarjeta-cliente__sede-badge--vacio {
  background: transparent;
  color: var(--text-tertiary);
  font-weight: 400;
}

.tarjeta-cliente__divider {
  border: none;
  border-top: 1px solid var(--border-primary);
  margin: var(--space-3) 0;
}

.tarjeta-cliente__actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.tarjeta-cliente__deudas {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-primary);
}

.tarjeta-cliente__deudas-list {
  margin-top: var(--space-2);
  padding: var(--space-2);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
}

.tarjeta-cliente__deudas-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tarjeta-cliente__deuda-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-1) 0;
  border-bottom: 1px solid var(--border-primary);
  font-size: 0.8125rem;
  color: var(--text-primary);
}

.tarjeta-cliente__deuda-item:last-child {
  border-bottom: none;
}

.tarjeta-cliente__panel {
  border-top: 1px solid var(--border-primary);
  overflow: hidden;
}

.deudas-seccion-titulo {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  padding: 6px 0 2px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.btn-marcar-pagado {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}
.btn-marcar-pagado:hover {
  background: #bbf7d0;
  border-color: #4ade80;
}

/* Responsive: acciones en columna en mobile */
@media (max-width: 768px) {
  .tarjeta-cliente__header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .tarjeta-cliente__badges {
    align-self: flex-start;
    flex-wrap: wrap;
  }

  .tarjeta-cliente__actions {
    flex-direction: column;
  }

  .tarjeta-cliente__actions .app-btn {
    width: 100%;
  }

  .tarjeta-cliente__body {
    padding: var(--space-3);
  }

  .tarjeta-cliente__title {
    font-size: 0.9375rem;
  }
}
</style>
