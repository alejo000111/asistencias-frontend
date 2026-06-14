<template>
  <div class="card shadow-sm" :class="[padre.estado === 'INACTIVO' ? 'border-secondary bg-light' : (padre.deudaTotal > 0 ? 'border-danger' : 'border-success'), 'tarjeta-cliente']">
    <div class="card-header text-white d-flex justify-content-between align-items-center" :class="padre.estado === 'INACTIVO' ? 'bg-secondary' : 'bg-dark'">
      <h5 class="mb-0">{{ padre.nombreCompleto }}
        <button @click="copiarLink" class="btn btn-sm btn-primary fw-bold shadow-sm ms-2 py-1 px-2" style="font-size: 0.80rem;">🔗 Copiar Link</button>
      </h5>
      <div class="d-flex align-items-center gap-1">
        <span v-if="padre.deudaTotal > 0" class="badge bg-danger fs-6 me-1 shadow-sm">Debe: ${{ formatearDinero(padre.deudaTotal) }}</span>
        <span v-if="padre.saldoAbono > 0" class="badge bg-success fs-6 shadow-sm">Abono: ${{ formatearDinero(padre.saldoAbono) }}</span>
      </div>
    </div>
    <div class="card-body p-0">
      <div class="p-3" v-if="activeFormType !== 'edit'">
        <p class="mb-2 text-dark"><strong>📞 Telefono:</strong> {{ padre.telefono }}</p>
        <ul class="list-group list-group-flush mb-3 small">
          <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 border-0 pt-1 pb-1" v-for="hijo in padre.students" :key="hijo.id">
            <span>
              🛼 {{ hijo.nombreCompleto }} <span class="text-muted">({{ hijo.edad || 'N/A' }} años)</span>
              <span class="text-muted small d-block" style="font-size: 0.7rem; line-height: 1.2;">🏢 {{ formatearMatriculas(hijo.matriculas) || 'Sin matricula' }}</span>
            </span>
          </li>
        </ul>
        <hr class="text-muted my-2">
        <div class="d-flex gap-2 mt-3">
          <button @click="$emit('toggleCardForm', { clientId: padre.id, formType: 'abono' }); $emit('toggleDeudas', null)" class="btn btn-sm btn-success w-100 fw-bold shadow-sm" :disabled="padre.estado === 'INACTIVO'">💰 Abono</button>
          <button @click="toggleHistorial(); $emit('toggleDeudas', null)" class="btn btn-sm w-100 text-white fw-bold shadow-sm" style="background-color: #374151;">📄 Historial</button>
          <button @click="activarModoEdicion(); $emit('toggleDeudas', null)" class="btn btn-sm w-100 text-white fw-bold shadow-sm" style="background-color: #475569;">⚙️ Editar</button>
        </div>
        <div v-if="padre.deudaTotal > 0" class="mt-3 border-top pt-3">
          <button @click="toggleDeudas(); $emit('toggleCardForm', { clientId: padre.id, formType: null })" class="btn btn-sm w-100 fw-bold shadow-sm transition" :style="{ backgroundColor: mostrarDeudas ? '#991b1b' : '#e63946', color: 'white' }">💸 Clases por Pagar</button>
          <div v-if="mostrarDeudas" class="mt-2 p-2 rounded small shadow-sm" style="background-color: #fffbfa; border: 1px solid #e63946;">
            <ul class="list-group list-group-flush">
              <li v-for="deuda in listaDeudas" :key="deuda.id" class="list-group-item px-1 py-1 text-muted border-bottom d-flex justify-content-between align-items-center" style="background-color: transparent;">
                <div><span class="text-dark fw-bold">• {{ deuda.student.nombreCompleto }}</span><br><small class="fw-bold text-muted">{{ formatearFecha(deuda.fecha) }}</small></div>
                <span class="badge bg-dark fs-6 shadow-sm">${{ formatearDinero(deuda.precioCobrado) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div v-show="activeFormType" class="border-top panel-desplegable">
        <div v-if="activeFormType === 'abono'" class="p-3 bg-white shadow-sm">
          <label class="form-label text-sm mb-1 fw-bold text-dark">Monto a abonar:</label>
          <input type="text" inputmode="numeric" :value="formatearMontoInput(padre.nuevoAbono)" @input="actualizarMontoInput($event, padre)" class="form-control form-control-sm mb-2" placeholder="Ej: 50.000" />
          <div class="row">
            <div class="col-6"><label class="form-label text-sm mb-1 fw-bold text-dark">Metodo:</label><select v-model="padre.metodoPago" class="form-select form-select-sm mb-3"><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option></select></div>
            <div class="col-6"><label class="form-label text-sm mb-1 fw-bold text-dark">Fecha de pago:</label><input type="date" v-model="padre.fechaAbono" class="form-control form-control-sm mb-3"></div>
          </div>
          <button @click="enviarAbono" :disabled="procesandoPago" class="btn btn-sm btn-success w-100 fw-bold shadow-sm">{{ procesandoPago ? '⏳ Procesando...' : 'Confirmar Pago' }}</button>
        </div>
        <div v-if="activeFormType === 'historial'" class="p-3 bg-light shadow-sm">
          <h6 class="text fw-bold border-bottom pb-1 mb-2">Ultimos 10 Movimientos</h6>
          <div v-if="cargandoHistorial" class="text-center text-muted small py-2">Cargando...</div>
          <ul v-else class="list-group list-group-flush small">
            <li v-for="log in historialFiltrado" :key="log.id" class="list-group-item bg-transparent px-0 d-flex justify-content-between align-items-center border-bottom border-light">
              <div><strong class="text-dark">{{ formatearFecha(log.fecha) }}</strong><br><span class="text-muted" style="font-size: 0.85rem;">💰 Abono ({{ log.metodoPago === 'TRANSFERENCIA' ? 'Transf.' : 'Efectivo' }})</span></div>
              <div class="d-flex align-items-center gap-2"><span class="text-success fw-bold">+${{ formatearDinero(log.monto) }}</span><button v-if="esAdmin" @click="eliminarAbono(log)" class="btn btn-sm text-danger p-0 border-0">🗑️</button></div>
            </li>
            <li v-if="historialFiltrado.length === 0" class="list-group-item bg-transparent text-muted text-center px-0">No hay movimientos registrados.</li>
          </ul>
        </div>
        <div v-if="activeFormType === 'edit'" class="bg-white p-3 shadow-sm panel-edicion">
          <div class="d-flex justify-content-between align-items-center border-bottom pb-1 mb-2">
            <h6 class="text-secondary fw-bold mb-0">Editar Padre</h6>
            <button v-if="esAdmin && padre.estado === 'INACTIVO'" @click="eliminarPadre" class="btn btn-sm btn-outline-danger py-0 px-2 fw-bold">🗑️ Eliminar Definitivamente (Borrará todo el historial)</button>
          </div>
          <input type="text" v-model="padre.editNombre" class="form-control form-control-sm mb-2" placeholder="Nombre Completo">
          <input type="text" v-model="padre.editTelefono" class="form-control form-control-sm mb-2" placeholder="Telefono">
          <select v-model="padre.editEstado" class="form-select form-select-sm mb-4 fw-bold shadow-sm" 
            :style="padre.editEstado === 'INACTIVO' 
              ? 'background-color: #fee2e2; color: #991b1b; border-color: #fca5a5; box-shadow: 0 0 0 0.2rem rgba(239,68,68,0.15);' 
              : 'background-color: #d1fae5; color: #065f46; border-color: #86efac; box-shadow: 0 0 0 0.2rem rgba(34,197,94,0.15);'">
            <option value="ACTIVO" style="background-color: #d1fae5; color: #065f46;">🟢 ACTIVO</option>
            <option value="INACTIVO" style="background-color: #fee2e2; color: #991b1b;">🔴 INACTIVO</option>
          </select>
          <h6 class="text-secondary fw-bold border-bottom pb-1">Editar Deportistas</h6>
          <div v-for="(hijo, idx) in padre.students" :key="hijo.id" class="mb-3 border-start border-3 ps-2 position-relative" style="border-color: #cbd5e1 !important;">
            <div class="d-flex gap-2 mb-1">
              <input type="text" v-model="hijo.editNombre" class="form-control form-control-sm" placeholder="Nombre del Deportista">
              <button v-if="esAdmin && padre.estado === 'INACTIVO'" @click="eliminarDeportista(hijo.id, hijo.editNombre)" class="btn btn-sm btn-danger px-2 py-0 shadow-sm">🗑️</button>
            </div>
            <div class="d-flex gap-1 mt-1">
              <input type="date" v-model="hijo.editFechaNacimiento" @change="calcularEdad(hijo)" class="form-control form-control-sm w-50">
              <input type="number" v-model="hijo.editEdad" class="form-control form-control-sm w-25 bg-light text-secondary fw-bold text-center" readonly title="Edad calculada">
            </div>
            <div class="mt-2">
              <div class="fw-bold small text-secondary mb-1">Sedes / Grupos:</div>
              <div v-for="s in sedes.filter(s => s.activa !== false)" :key="s.id" class="mb-2 border-bottom pb-1">
                <div class="form-check">
                  <input type="checkbox" :id="'chk-' + idx + '-' + s.id" :value="s.id" v-model="hijo.editSedeIds" class="form-check-input" @change="sincronizarMatricula(hijo, s.id)">
                  <label :for="'chk-' + idx + '-' + s.id" class="form-check-label fw-bold small">{{ s.nombre }}</label>
                </div>
                <select v-if="hijo.editSedeIds.includes(s.id)" v-model="hijo.editNiveles[s.id]" class="form-select form-select-sm mt-1 fw-bold" style="max-width: 220px;">
                  <option value="" disabled>Selecciona grupo...</option>
                  <template v-for="g in (s.grupos || [])" :key="g.nombre">
                    <option v-if="g && g.nombre && g.nombre.trim() !== ''" :value="(g.emoji || '') + ' ' + g.nombre">{{ g.emoji ? g.emoji + ' ' : '' }}{{ g.nombre }}</option>
                  </template>
                </select>
              </div>
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
import { ref, computed, watch } from 'vue';
import axios from 'axios';

const esAdmin = localStorage.getItem('authRole') === 'ADMIN';
const props = defineProps(['padre', 'activeFormType', 'activeDeudasId']);
const emit = defineEmits(['toggleCardForm', 'toggleDeudas', 'clienteActualizado', 'recargar']);

const sedes = ref([]);
const historialPadre = ref([]);
const cargandoHistorial = ref(false);

const formatearMatriculas = (matriculas) => {
  if (!matriculas || matriculas.length === 0) return '';
  return matriculas.map(m => (m.sede?.nombre || '?') + ' (' + m.nivel + ')').join(' | ');
};

const cargarSedes = async () => {
  try { const res = await axios.get('/api/sedes'); sedes.value = res.data; }
  catch (e) { console.error('Error al cargar sedes:', e); }
};

const historialFiltrado = computed(() => historialPadre.value.filter(log => log.tipoMovimiento === 'INGRESO_ABONO'));
const listaDeudas = ref([]);

const mostrarDeudas = computed(() => props.activeDeudasId === props.padre.id);

const toggleDeudas = async () => {
  emit('toggleDeudas', props.padre.id);
  if (!mostrarDeudas.value) {
    try { const r = await axios.get('/api/finanzas/deudas/' + props.padre.id); listaDeudas.value = r.data; }
    catch (e) { console.error("Error:", e); }
  }
};

const formatearFecha = (f) => {
  if (!f) return '';
  if (Array.isArray(f)) return new Date(Date.UTC(f[0], f[1]-1, f[2])).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric', timeZone:'UTC' });
  return new Date(f).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric', timeZone:'UTC' });
};

const formatearDinero = (m) => { if (!m && m !== 0) return '0'; return Number(m).toLocaleString('es-CO'); };
const formatearMontoInput = (v) => { if (!v && v !== 0) return ''; const d = String(v).replace(/\D/g,''); return d ? Number(d).toLocaleString('es-CO') : ''; };
const actualizarMontoInput = (e, p) => { const r = e.target.value.replace(/\D/g,''); p.nuevoAbono = r ? Number(r) : ''; };

watch(() => props.activeFormType, (n) => { if (n === 'historial' && historialPadre.value.length === 0) cargarHistorialCompleto(); });
const toggleHistorial = () => emit('toggleCardForm', { clientId: props.padre.id, formType: 'historial' });
const cargarHistorialCompleto = async () => {
  cargandoHistorial.value = true;
  try { const r = await axios.get('/api/finanzas/historial/' + props.padre.id); historialPadre.value = r.data; }
  catch (e) { console.error("Error:", e); } finally { cargandoHistorial.value = false; }
};

const calcularEdad = (h) => {
  if (!h.editFechaNacimiento) return;
  const hoy = new Date(), c = new Date(h.editFechaNacimiento);
  let e = hoy.getFullYear() - c.getFullYear();
  const m = hoy.getMonth() - c.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < c.getDate())) e--;
  h.editEdad = e >= 0 ? e : 0;
};

const sincronizarMatricula = (hijo, sedeId) => {
  if (!hijo.editSedeIds.includes(sedeId)) { delete hijo.editNiveles[sedeId]; }
  else { hijo.editNiveles[sedeId] = ''; }
};

const activarModoEdicion = () => {
  cargarSedes();
  props.padre.editNombre = props.padre.nombreCompleto;
  props.padre.editTelefono = props.padre.telefono;
  props.padre.editEstado = props.padre.estado || 'ACTIVO';
  if (props.padre.students) {
    props.padre.students.forEach(hijo => {
      hijo.editNombre = hijo.nombreCompleto;
      hijo.editEdad = hijo.edad;
      hijo.editFechaNacimiento = hijo.fechaNacimiento;
      const mats = hijo.matriculas || [];
      hijo.editSedeIds = mats.map(m => m.sede?.id).filter(id => id != null);
      hijo.editNiveles = {};
      mats.forEach(m => { if (m.sede?.id) hijo.editNiveles[m.sede.id] = m.nivel; });
    });
  }
  emit('toggleCardForm', { clientId: props.padre.id, formType: 'edit' });
};

const cancelarEdicion = () => emit('toggleCardForm', { clientId: props.padre.id, formType: 'edit' });

const guardarEdicion = async () => {
  // Validar que todas las sedes tengan grupo seleccionado
  if (props.padre.students) {
    for (const hijo of props.padre.students) {
      const sedesSinGrupo = (hijo.editSedeIds || []).filter(sid => !hijo.editNiveles[sid] || hijo.editNiveles[sid] === '');
      if (sedesSinGrupo.length > 0) {
        alert('⚠️ Por favor selecciona un grupo para todas las sedes marcadas en el deportista: ' + (hijo.editNombre || hijo.nombreCompleto));
        return;
      }
    }
  }
  try {
    await axios.put('/api/registro/padre/' + props.padre.id, null, {
      params: { nombreCompleto: props.padre.editNombre, telefono: props.padre.editTelefono, estado: props.padre.editEstado }
    });
    const eh = props.padre.editEstado === 'INACTIVO' ? 'RETIRADO' : 'ACTIVO';
    if (props.padre.students && props.padre.students.length > 0) {
      await Promise.all(props.padre.students.map(hijo => {
        const matriculas = [];
        (hijo.editSedeIds || []).forEach(sid => {
          if (hijo.editNiveles[sid]) matriculas.push({ sedeId: sid, nivel: hijo.editNiveles[sid] });
        });
        return axios.put('/api/registro/deportista/' + hijo.id, {
          nombreCompleto: hijo.editNombre, edad: hijo.editEdad,
          fechaNacimiento: hijo.editFechaNacimiento, estado: eh, matriculas: matriculas
        });
      }));
    }
    alert("✅ Cambios guardados correctamente.");
    emit('toggleCardForm', { clientId: props.padre.id, formType: 'edit' });
    emit('recargar');
  } catch (error) { console.error(error); alert("❌ Error al guardar los cambios."); }
};

const procesandoPago = ref(false);
const eliminarAbono = async (log) => {
  if (!confirm('¿Eliminar abono de $' + formatearDinero(log.monto) + '?')) return;
  try { await axios.delete('/api/finanzas/abono/' + log.id); alert('✅ Eliminado.'); emit('recargar'); if (props.activeFormType === 'historial') cargarHistorialCompleto(); }
  catch (e) { console.error(e); alert('❌ Error.'); }
};
const enviarAbono = async () => {
  if (!props.padre.nuevoAbono || props.padre.nuevoAbono <= 0) return alert("⚠️ Monto invalido.");
  procesandoPago.value = true;
  try { await axios.post('/api/finanzas/abono', null, { params: { parentId: props.padre.id, monto: props.padre.nuevoAbono, metodoPago: props.padre.metodoPago, fecha: props.padre.fechaAbono } }); alert('✅ Abono registrado.'); emit('recargar'); emit('toggleCardForm', { clientId: props.padre.id, formType: null }); }
  catch (e) { console.error(e); alert("❌ Error."); } finally { procesandoPago.value = false; }
};
const eliminarDeportista = async (idHijo, nombreHijo) => {
  if (!confirm('¿Eliminar a ' + nombreHijo + '?')) return;
  try { await axios.delete('/api/registro/deportista/' + idHijo); alert('✅ Eliminado.'); if (Array.isArray(props.padre.students)) props.padre.students = props.padre.students.filter(h => h.id !== idHijo); emit('toggleCardForm', { clientId: props.padre.id, formType: null }); emit('recargar'); }
  catch (e) { console.error(e); alert('❌ Error.'); }
};
const copiarLink = async () => {
  const url = window.location.origin + '/portal/' + props.padre.secretToken;
  try { await navigator.clipboard.writeText(url); alert('✅ Enlace copiado'); }
  catch { const ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); alert('✅ Enlace copiado'); }
};
const eliminarPadre = async () => {
  if (!confirm('🚨 ¿Eliminar a ' + props.padre.nombreCompleto + ' y TODOS sus deportistas?')) return;
  try { const res = await axios.delete('/api/registro/padre/' + props.padre.id); alert(res.data); emit('toggleCardForm', { clientId: props.padre.id, formType: null }); emit('recargar'); }
  catch (e) { alert("❌ " + (e.response?.data || e.message)); }
};
</script>

<style scoped>
.tarjeta-cliente { transition: all 0.2s ease-out; }
.tarjeta-cliente.border-primary { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important; }
.panel-desplegable { overflow: hidden; transition: height 0.2s ease-out; }
.panel-edicion { border-top: 2px solid var(--bs-primary); }
</style>
