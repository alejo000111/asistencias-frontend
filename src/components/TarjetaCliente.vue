<template>
  <div class="card shadow-sm" :class="[padre.estado === 'INACTIVO' ? 'border-secondary bg-light' : (padre.deudaTotal > 0 ? 'border-danger' : 'border-success'), 'tarjeta-cliente']">
    <div class="card-header text-white d-flex justify-content-between align-items-center" :class="padre.estado === 'INACTIVO' ? 'bg-secondary' : 'bg-dark'">
      <h5 class="mb-0">{{ padre.nombreCompleto }}
        <button @click="copiarLink" class="btn btn-sm btn-outline-light ms-2 py-0 px-1" style="font-size: 0.75rem; opacity: 0.7;" title="Copiar enlace del portal de padres">
          🔗 Copiar Link
        </button>
      </h5>
      <div class="d-flex align-items-center gap-1">
        <span v-if="padre.deudaTotal > 0" class="badge bg-danger fs-6 me-1 shadow-sm">Debe: ${{ formatearDinero(padre.deudaTotal) }}</span>
        <span v-if="padre.saldoAbono > 0" class="badge bg-success fs-6 shadow-sm">Abono: ${{ formatearDinero(padre.saldoAbono) }}</span>
      </div>
    </div>
    
    <div class="card-body p-0">
      
      <div class="p-3" v-if="activeFormType !== 'edit'">
        <p class="mb-2 text-dark"><strong>📞 Teléfono:</strong> {{ padre.telefono }}</p>
        
        <ul class="list-group list-group-flush mb-3 small">
            <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 border-0 pt-1 pb-1" v-for="hijo in padre.students" :key="hijo.id">
                <span :class="{'text-decoration-line-through text-muted': padre.estado === 'INACTIVO', 'text-dark fw-medium': padre.estado !== 'INACTIVO'}">
                    🛼 {{ hijo.nombreCompleto }} <span class="text-muted">({{ hijo.edad || 'N/A' }} años)</span>
                    
                    <span class="badge ms-1 shadow-sm fw-bold" 
                          :style="hijo.nivel === 'AVANZADO' ? 'background-color: #f97316; color: white;' : 'background-color: #10b981; color: white;'">
                      {{ hijo.nivel === 'AVANZADO' ? '🔥 Avanzado' : '🌱 Iniciación' }}
                    </span>
                </span>
            </li>
        </ul>

        <hr class="text-muted my-2">
        <div class="d-flex gap-2 mt-3">
          <button @click="$emit('toggleCardForm', { clientId: padre.id, formType: 'abono' }); mostrarDeudas = false" class="btn btn-sm btn-success w-100 fw-bold shadow-sm" :disabled="padre.estado === 'INACTIVO'">
            💰 Abono
          </button>
          
          <button @click="toggleHistorial(); mostrarDeudas = false" class="btn btn-sm w-100 text-white fw-bold shadow-sm" style="background-color: #374151; border: none;">
            📄 Historial
          </button>
          
          <button @click="activarModoEdicion(); mostrarDeudas = false" class="btn btn-sm w-100 text-white fw-bold shadow-sm" style="background-color: #475569; border: none;">
            ⚙️ Editar
          </button>
        </div>

        <div v-if="padre.deudaTotal > 0" class="mt-3 border-top pt-3">
          <button @click="toggleDeudas(); $emit('toggleCardForm', { clientId: padre.id, formType: null })" class="btn btn-sm w-100 fw-bold shadow-sm transition" style="background-color: #e63946; color: white; border: none;">
            💸 Clases por Pagar
          </button>

          <div v-if="mostrarDeudas" class="mt-2 p-2 rounded small shadow-sm" style="background-color: #fffbfa; border: 1px solid #e63946;">
            <ul class="list-group list-group-flush">
              <li v-for="deuda in listaDeudas" :key="deuda.id" class="list-group-item px-1 py-1 text-muted border-bottom d-flex justify-content-between align-items-center" style="background-color: transparent; border-color: #f5e6e6 !important;">
                <div>
                  <span class="text-dark fw-bold">• {{ deuda.student.nombreCompleto }}</span> <br>
                  <small class="fw-bold text-muted">{{ formatearFecha(deuda.fecha) }}</small>
                </div>
                <span class="badge bg-dark fs-6 shadow-sm">${{ formatearDinero(deuda.precioCobrado) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div v-show="activeFormType" class="border-top panel-desplegable">
        
        <div v-if="activeFormType === 'abono'" class="p-3 bg-white shadow-sm">
          <label class="form-label text-sm mb-1 fw-bold text-dark">Monto a abonar:</label>
          <input
            type="text"
            inputmode="numeric"
            :value="formatearMontoInput(padre.nuevoAbono)"
            @input="actualizarMontoInput($event, padre)"
            class="form-control form-control-sm mb-2"
            placeholder="Ej: 50.000"
          />
          
          <div class="row">
            <div class="col-6">
              <label class="form-label text-sm mb-1 fw-bold text-dark">Método:</label>
              <select v-model="padre.metodoPago" class="form-select form-select-sm mb-3">
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label text-sm mb-1 fw-bold text-dark">Fecha de pago:</label>
              <input type="date" v-model="padre.fechaAbono" class="form-control form-control-sm mb-3">
            </div>
          </div>
          <button @click="enviarAbono" :disabled="procesandoPago" class="btn btn-sm btn-success w-100 fw-bold shadow-sm">
            {{ procesandoPago ? '⏳ Procesando...' : 'Confirmar Pago' }}
          </button>
        </div>

        <div v-if="activeFormType === 'historial'" class="p-3 bg-light shadow-sm">
          <h6 class="text fw-bold border-bottom pb-1 mb-2">Últimos 10 Movimientos</h6>
          <div v-if="cargandoHistorial" class="text-center text-muted small py-2">Cargando...</div>
          <ul v-else class="list-group list-group-flush small">
            <li v-for="log in historialFiltrado" :key="log.id" class="list-group-item bg-transparent px-0 d-flex justify-content-between align-items-center border-bottom border-light">
              <div>
                <strong class="text-dark">{{ formatearFecha(log.fecha) }}</strong><br>
                <span class="text-muted" style="font-size: 0.85rem;">
                  💰 Abono ({{ log.metodoPago === 'TRANSFERENCIA' ? 'Transf.' : 'Efectivo' }})
                </span>
              </div>
              <div class="d-flex align-items-center gap-2">
                <span class="text-success fw-bold">+${{ formatearDinero(log.monto) }}</span>
                <button
                  @click="eliminarAbono(log)"
                  class="btn btn-sm text-danger p-0 border-0"
                  title="Eliminar este abono"
                >🗑️</button>
              </div>
            </li>
            <li v-if="historialFiltrado.length === 0" class="list-group-item bg-transparent text-muted text-center px-0">
              No hay movimientos registrados.
            </li>
          </ul>
        </div>

        <div v-if="activeFormType === 'edit'" class="bg-white p-3 shadow-sm panel-edicion">
          <div class="d-flex justify-content-between align-items-center border-bottom pb-1 mb-2">
            <h6 class="text-secondary fw-bold mb-0">Editar Padre</h6>
            <button @click="eliminarPadre" class="btn btn-sm btn-outline-danger py-0 px-2" title="Eliminar Padre y toda su familia">
              🗑️ Eliminar Familia
            </button>
          </div>
          
          <input type="text" v-model="padre.editNombre" class="form-control form-control-sm mb-2" placeholder="Nombre Completo">
          <input type="text" v-model="padre.editTelefono" class="form-control form-control-sm mb-2" placeholder="Teléfono">
          
          <select v-model="padre.editEstado" class="form-select form-select-sm mb-4 fw-bold shadow-sm" 
                  :style="padre.editEstado === 'INACTIVO' ? 'background-color: #fee2e2; color: #991b1b; border-color: #f87171;' : 'background-color: #d1fae5; color: #065f46; border-color: #34d399;'">
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
          </select>

          <h6 class="text-secondary fw-bold border-bottom pb-1">Editar Deportistas</h6>
          <div v-for="hijo in padre.students" :key="hijo.id" class="mb-3 border-start border-3 ps-2 position-relative" style="border-color: #cbd5e1 !important;">
            
            <div class="d-flex gap-2 mb-1">
              <input type="text" v-model="hijo.editNombre" class="form-control form-control-sm" placeholder="Nombre del Deportista">
              <button @click="eliminarDeportista(hijo.id, hijo.editNombre)" class="btn btn-sm btn-danger px-2 py-0 shadow-sm" title="Eliminar Deportista">
                🗑️
              </button>
            </div>
            
            <div class="d-flex gap-1 mt-1">
                <input type="date" v-model="hijo.editFechaNacimiento" @change="calcularEdad(hijo)" class="form-control form-control-sm w-50">
                <input type="number" v-model="hijo.editEdad" class="form-control form-control-sm w-25 bg-light text-secondary fw-bold text-center" readonly title="Edad calculada">
                
                <select v-model="hijo.editNivel" class="form-select form-select-sm w-25 fw-bold"
                        :style="hijo.editNivel === 'AVANZADO' ? 'background-color: #ffedd5; color: #c2410c; border-color: #fdba74;' : 'background-color: #d1fae5; color: #065f46; border-color: #34d399;'">
                    <option value="INICIACIÓN">🌱 Iniciación</option>
                    <option value="AVANZADO">🔥 Avanzado</option>
                </select>
            </div>
          </div>

          <div class="d-flex gap-2 mt-4 pt-2 border-top">
            <button @click="cancelarEdicion" class="btn btn-sm btn-outline-danger w-50 fw-bold shadow-sm">✖ Cancelar</button>
            <button @click="guardarEdicion" class="btn btn-sm btn-success w-50 fw-bold shadow-sm">💾 Guardar</button>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue';
import axios from 'axios';

const props = defineProps(['padre', 'activeFormType']);
const emit = defineEmits(['toggleCardForm', 'clienteActualizado', 'recargar']); 

const historialPadre = ref([]);
const cargandoHistorial = ref(false);

const historialFiltrado = computed(() => {
  // Excluye registros de descuento automático (USO_ABONO_CLASE), solo muestra abonos reales
  return historialPadre.value.filter(log => log.tipoMovimiento === 'INGRESO_ABONO');
});
const mostrarDeudas = ref(false);
const listaDeudas = ref([]);

const toggleDeudas = async () => {
  mostrarDeudas.value = !mostrarDeudas.value;
  
  // Solo hace la consulta si abrimos el botón (para ahorrar recursos)
  if (mostrarDeudas.value) {
    try {
      const response = await axios.get(`/api/finanzas/deudas/${props.padre.id}`);
      listaDeudas.value = response.data;
    } catch (error) {
      console.error("Error al cargar deudas:", error);
    }
  }
};

const formatearFecha = (fechaDato) => {
  if (!fechaDato) return '';
  if (Array.isArray(fechaDato)) {
    return new Date(Date.UTC(fechaDato[0], fechaDato[1] - 1, fechaDato[2])).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  return new Date(fechaDato).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

const formatearDinero = (monto) => {
  if (!monto && monto !== 0) return '0';
  // 'es-CO' le dice a JavaScript que use el formato de Colombia (puntos para miles)
  return Number(monto).toLocaleString('es-CO');
};

// Formatea el valor del input con separadores de miles mientras el usuario escribe
const formatearMontoInput = (valor) => {
  if (!valor && valor !== 0) return '';
  const soloDigitos = String(valor).replace(/\D/g, '');
  if (!soloDigitos) return '';
  return Number(soloDigitos).toLocaleString('es-CO');
};

// Parsea el texto escrito, extrae solo dígitos y guarda como número
const actualizarMontoInput = (event, padre) => {
  const raw = event.target.value.replace(/\D/g, '');
  padre.nuevoAbono = raw ? Number(raw) : '';
};

watch(() => props.activeFormType, (newFormType) => {
  if (newFormType === 'historial' && historialPadre.value.length === 0) {
    cargarHistorialCompleto();
  }
});

const toggleHistorial = () => {
  emit('toggleCardForm', { clientId: props.padre.id, formType: 'historial' });
};

const cargarHistorialCompleto = async () => {
  cargandoHistorial.value = true;
  try {
    const response = await axios.get(`/api/finanzas/historial/${props.padre.id}`);
    historialPadre.value = response.data;
  } catch (error) {
    console.error("Error cargando historial del padre:", error);
  } finally {
    cargandoHistorial.value = false;
  }
};

const calcularEdad = (hijo) => {
  if (!hijo.editFechaNacimiento) return;
  const hoy = new Date();
  const cumpleanos = new Date(hijo.editFechaNacimiento);
  let edad = hoy.getFullYear() - cumpleanos.getFullYear();
  const mes = hoy.getMonth() - cumpleanos.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < cumpleanos.getDate())) {
    edad--;
  }
  hijo.editEdad = edad >= 0 ? edad : 0;
};

const activarModoEdicion = () => {
  props.padre.editNombre = props.padre.nombreCompleto;
  props.padre.editTelefono = props.padre.telefono;
  props.padre.editEstado = props.padre.estado || 'ACTIVO';
  
  if (props.padre.students) {
    props.padre.students.forEach(hijo => {
      hijo.editNombre = hijo.nombreCompleto;
      hijo.editEdad = hijo.edad;
      hijo.editFechaNacimiento = hijo.fechaNacimiento;
      hijo.editNivel = hijo.nivel || 'INICIACIÓN'; // Seguro contra vacíos
    });
  }
  emit('toggleCardForm', { clientId: props.padre.id, formType: 'edit' });
};

const cancelarEdicion = () => {
  emit('toggleCardForm', { clientId: props.padre.id, formType: 'edit' });
};

const guardarEdicion = async () => {
  try {
    await axios.put(`/api/registro/padre/${props.padre.id}`, null, {
      params: { nombreCompleto: props.padre.editNombre, telefono: props.padre.editTelefono, estado: props.padre.editEstado }
    });

    const estadoHeredado = props.padre.editEstado === 'INACTIVO' ? 'RETIRADO' : 'ACTIVO';
    
    if (props.padre.students && props.padre.students.length > 0) {
      await Promise.all(props.padre.students.map(hijo => 
        axios.put(`/api/registro/deportista/${hijo.id}`, null, {
          params: { 
            nombreCompleto: hijo.editNombre, 
            edad: hijo.editEdad, 
            fechaNacimiento: hijo.editFechaNacimiento,
            estado: estadoHeredado,
            nivel: hijo.editNivel || 'INICIACIÓN' 
          }
        })
      ));
    }
    
    alert("✅ Cambios guardados correctamente.");
    
    emit('toggleCardForm', { clientId: props.padre.id, formType: 'edit' });
    
    emit('recargar'); 
    
  } catch (error) {
    console.error(error);
    alert("❌ Error al guardar los cambios.");
  }
};

const procesandoPago = ref(false);

const eliminarAbono = async (log) => {
  if (!confirm(`¿Eliminar este abono de $${formatearDinero(log.monto)}? Se revertirá del saldo del cliente.`)) return;
  try {
    await axios.delete(`/api/finanzas/abono/${log.id}`);
    alert('✅ Abono eliminado correctamente.');
    emit('recargar');
    // Recargar el historial si está abierto
    if (props.activeFormType === 'historial') {
      cargarHistorialCompleto();
    }
  } catch (error) {
    console.error(error);
    alert('❌ Error al eliminar el abono.');
  }
};

const enviarAbono = async () => {
  if (!props.padre.nuevoAbono || props.padre.nuevoAbono <= 0) return alert("⚠️ Monto inválido.");
  procesandoPago.value = true;
  try {
    await axios.post('/api/finanzas/abono', null, {
      params: { 
        parentId: props.padre.id, 
        monto: props.padre.nuevoAbono, 
        metodoPago: props.padre.metodoPago,
        fecha: props.padre.fechaAbono 
      }
    });
    alert(`✅ Abono registrado.`);
    emit('recargar');
    emit('toggleCardForm', { clientId: props.padre.id, formType: null });
  } catch (error) { 
    console.error(error);
    alert("❌ Error al registrar el abono."); 
  } finally {
    procesandoPago.value = false;
  }
};

const eliminarDeportista = async (idHijo, nombreHijo) => {
  if (!confirm(`¿Estás SEGURO de eliminar a ${nombreHijo}?`)) return;
  
  try {
    await axios.delete(`/api/registro/deportista/${idHijo}`);
    
    alert(`✅ ${nombreHijo} eliminado correctamente.`);

    if (Array.isArray(props.padre.students)) {
      props.padre.students = props.padre.students.filter(h => h.id !== idHijo);
    }

    emit('toggleCardForm', { clientId: props.padre.id, formType: null });
    emit('recargar');

  } catch (error) {
    console.error("Error detallado:", error);
    alert("❌ Error al procesar la eliminación en la pantalla.");
  }
};

const copiarLink = async () => {
  const url = window.location.origin + '/portal/' + props.padre.secretToken;
  try {
    await navigator.clipboard.writeText(url);
    alert('✅ Enlace del portal copiado al portapapeles');
  } catch {
    // Fallback para navegadores sin acceso al clipboard
    const textarea = document.createElement('textarea');
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('✅ Enlace del portal copiado al portapapeles');
  }
};

const eliminarPadre = async () => {
  if (!confirm(`🚨 ¡ADVERTENCIA! ¿Estás seguro de eliminar a ${props.padre.nombreCompleto} y TODOS sus deportistas?`)) return;
  
  try {
    const res = await axios.delete(`/api/registro/padre/${props.padre.id}`);
    alert(res.data);
    emit('toggleCardForm', { clientId: props.padre.id, formType: null });
    emit('recargar');
  } catch (e) {
    alert("❌ " + (e.response?.data || e.message));
  }
};
</script>

<style scoped>
.tarjeta-cliente {
  transition: all 0.2s ease-out;
}

.tarjeta-cliente.border-primary {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important;
}

.panel-desplegable {
  overflow: hidden;
  transition: height 0.2s ease-out;
}

.panel-edicion {
  border-top: 2px solid var(--bs-primary);
}
</style>