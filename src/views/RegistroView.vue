<template>
  <div class="row align-items-start">
    <h3 class="mb-4 mt-0">📝 Inscripciones</h3>
    <div class="col-md-5 mb-4">
      <div class="card shadow-sm border-success">
        <div class="card-header bg-success text-white"><h5 class="mb-0">👨‍👩‍👦 Registrar Padre / Acudiente</h5></div>
        <div class="card-body">
          <div class="mb-3"><label class="form-label">Nombre Completo</label><input type="text" v-model="formPadre.nombreCompleto" class="form-control" placeholder="Ej: Carlos Perez"></div>
          <div class="mb-3"><label class="form-label">Telefono</label><input type="text" v-model="formPadre.telefono" class="form-control" placeholder="Ej: 3001234567"></div>
          <button @click="enviarPadre" class="btn btn-success w-100">Guardar Padre</button>
        </div>
      </div>
    </div>
    <div class="col-md-7 mb-4">
      <div class="card shadow-sm h-100 border-primary">
        <div class="card-header bg-primary text-white"><h5 class="mb-0">🛼 Registrar Deportista</h5></div>
        <div class="card-body">
          <div v-if="limiteAlcanzado" class="alert alert-danger fw-bold text-center">
            ⚠️ Ups, has alcanzado el número máximo de deportistas permitido en tu plan. Por favor, contacta al administrador Alejandro para actualizar tu membresía.
          </div>
          <div class="mb-3" style="position: relative;">
            <label class="form-label text-primary fw-bold">Buscar Padre / Acudiente</label>
            <input type="text" v-model="textoBusquedaPadre" class="form-control border-primary shadow-sm" placeholder="Escribe el nombre del padre..." @focus="abrirDropdown" @blur="cerrarDropdownConDelay" :disabled="limiteAlcanzado" />
            <ul v-if="mostrarDropdown && padresFiltrados.length > 0" class="list-group position-absolute w-100 shadow-sm" style="z-index: 1000; max-height: 200px; overflow-y: auto; cursor: pointer;">
              <li v-for="padre in padresFiltrados" :key="padre.id" class="list-group-item list-group-item-action py-2" @mousedown.prevent="seleccionarPadre(padre)">{{ padre.nombreCompleto }}</li>
            </ul>
            <div v-if="padreSeleccionado" class="mt-1"><span class="badge bg-success fs-6 shadow-sm">✓ {{ padreSeleccionado.nombreCompleto }}</span></div>
          </div>
          <div class="mb-3"><label class="form-label">Nombre Completo</label><input type="text" v-model="formDeportista.nombreCompleto" class="form-control" placeholder="Ej: Andres Perez" :disabled="limiteAlcanzado"></div>
          <div class="row align-items-end">
            <div class="col-6 mb-3"><label class="form-label">Fecha de Nacimiento (Opcional)</label><input type="date" v-model="formDeportista.fechaNacimiento" @change="calcularEdad" class="form-control" :disabled="limiteAlcanzado"></div>
            <div class="col-6 mb-3"><label class="form-label">Edad</label><input type="number" v-model="formDeportista.edad" class="form-control bg-light text-primary fw-bold" placeholder="Se calcula sola" readonly title="Edad calculada a partir de la fecha de nacimiento"></div>
          </div>
          <div class="mt-3">
            <label class="form-label fw-bold text-primary">Sedes / Grupos:</label>
            <div v-for="s in sedesDisponibles.filter(s => s.activa !== false)" :key="s.id" class="mb-2 border-bottom pb-1">
              <div class="form-check">
                <input type="checkbox" :id="'reg-sede-' + s.id" :value="s.id" v-model="sedeIdsSeleccionados" class="form-check-input" @change="toggleSede(s.id)" :disabled="limiteAlcanzado">
                <label :for="'reg-sede-' + s.id" class="form-check-label fw-bold small">{{ s.nombre }}</label>
              </div>
              <div v-if="sedeIdsSeleccionados.includes(s.id)" class="form-check mt-1">
                <input type="radio" :id="'reg-sede-principal-' + s.id" name="reg-sede-principal" :value="s.id" v-model="sedePrincipalId" class="form-check-input" :disabled="limiteAlcanzado || sedeIdsSeleccionados.length === 1">
                <label :for="'reg-sede-principal-' + s.id" class="form-check-label small text-warning-emphasis">⭐ Sede principal (desde aquí se cobra la mensualidad)</label>
              </div>
              <select v-if="sedeIdsSeleccionados.includes(s.id)" v-model="nivelesPorSede[s.id]" class="form-select form-select-sm mt-1 fw-bold" style="max-width: 200px;" :disabled="limiteAlcanzado">
                <option value="" disabled>Selecciona grupo...</option>
                <template v-for="g in (s.grupos || [])" :key="g.nombre">
                  <option v-if="g && g.nombre && g.nombre.trim() !== ''" :value="(g.emoji || '') + ' ' + g.nombre">{{ g.emoji ? g.emoji + ' ' : '' }}{{ g.nombre }}</option>
                </template>
              </select>

              <!-- Plan de mensualidad — solo obligatorio en la sede principal, ahí es donde se cobra -->
              <select
                v-if="clubConfig?.preciosDiferenciados && sedeIdsSeleccionados.includes(s.id) && (planesPorSede[s.id] || []).length > 0"
                v-model="planPorSede[s.id]"
                class="form-select form-select-sm mt-1"
                style="max-width: 200px;"
                :disabled="limiteAlcanzado"
              >
                <option :value="null" disabled>Selecciona un plan{{ sedePrincipalId === s.id ? ' (Requerido)' : ' (opcional)' }}...</option>
                <option v-for="p in planesPorSede[s.id]" :key="p.id" :value="p.id">📋 {{ p.nombre }}</option>
              </select>
            </div>

            <!-- Plan Global (cuando los precios son unificados) -->
            <div v-if="!clubConfig?.preciosDiferenciados && sedeIdsSeleccionados.length > 0 && (planesPorSede['global'] || []).length > 0" class="mt-2 mb-2 p-2 border rounded bg-light">
              <div class="fw-bold small text-secondary mb-1">Plan de Mensualidad (Requerido):</div>
              <select v-model="planPorSede['global']" class="form-select form-select-sm" style="max-width: 240px;" :disabled="limiteAlcanzado">
                <option :value="null" disabled>Selecciona un plan...</option>
                <option v-for="p in planesPorSede['global']" :key="p.id" :value="p.id">📋 {{ p.nombre }}</option>
              </select>
            </div>
          </div>
          <button @click="enviarDeportista" class="btn btn-primary w-100 mt-3" :disabled="limiteAlcanzado">Guardar Deportista</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';

const padres = ref([]);
import { useSedes } from '@/utils/useSedes';
import { isLimiteAlcanzado } from '@/utils/auth';
import { usePlanesMensualidad } from '@/utils/usePlanesMensualidad';

const limiteAlcanzado = computed(() => isLimiteAlcanzado());

const { sedes: sedesDisponibles, cargarSedes } = useSedes();
const { planesPorSede, cargarPlanesDeSede, cargarTodosLosPlanes } = usePlanesMensualidad();
const clubConfig = ref(null);

const sedeIdsSeleccionados = ref([]);
const nivelesPorSede = ref({});
const planPorSede = ref({});
const sedePrincipalId = ref(null);
const formPadre = ref({ nombreCompleto: '', telefono: '' });
const formDeportista = ref({ parentId: '', nombreCompleto: '', edad: '', fechaNacimiento: '' });

const splitNombreApellido = (fullName) => {
  const partes = (fullName || '').trim().split(/\s+/);
  if (partes.length <= 1) {
    return { nombre: partes[0] || '', apellido: '' };
  }
  return { nombre: partes[0], apellido: partes.slice(1).join(' ') };
};

const textoBusquedaPadre = ref('');
const padreSeleccionado = ref(null);
const mostrarDropdown = ref(false);

const padresFiltrados = computed(() => {
  const busqueda = textoBusquedaPadre.value.toLowerCase().trim();
  if (!busqueda) return [];
  return padres.value.filter(p => p.nombreCompleto.toLowerCase().includes(busqueda));
});

const seleccionando = ref(false);

const seleccionarPadre = (padre) => {
  seleccionando.value = true;
  padreSeleccionado.value = padre;
  textoBusquedaPadre.value = padre.nombreCompleto;
  formDeportista.value.parentId = padre.id;
  mostrarDropdown.value = false;
};

const abrirDropdown = () => { if (textoBusquedaPadre.value.trim().length > 0) mostrarDropdown.value = true; };
const cerrarDropdownConDelay = () => { setTimeout(() => { mostrarDropdown.value = false; }, 200); };

watch(textoBusquedaPadre, (nuevoValor) => {
  if (seleccionando.value) { seleccionando.value = false; return; }
  if (!nuevoValor || nuevoValor.trim() === '') {
    padreSeleccionado.value = null;
    formDeportista.value.parentId = '';
    mostrarDropdown.value = false;
  } else mostrarDropdown.value = true;
});

const toggleSede = (sedeId) => {
  if (!sedeIdsSeleccionados.value.includes(sedeId)) {
    delete nivelesPorSede.value[sedeId];
    delete planPorSede.value[sedeId];
    if (sedePrincipalId.value === sedeId) {
      sedePrincipalId.value = sedeIdsSeleccionados.value[0] || null;
    }
  } else {
    if (!sedePrincipalId.value) {
      sedePrincipalId.value = sedeId;
    }
    cargarPlanesDeSede(sedeId);
  }
};

const calcularEdad = () => {
  const fechaNac = formDeportista.value.fechaNacimiento;
  if (!fechaNac) return;
  const hoy = new Date();
  const cumpleanos = new Date(fechaNac);
  let edad = hoy.getFullYear() - cumpleanos.getFullYear();
  const mes = hoy.getMonth() - cumpleanos.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < cumpleanos.getDate())) edad--;
  formDeportista.value.edad = edad >= 0 ? edad : 0;
};

const cargarPadres = async () => {
  try {
    const rol = localStorage.getItem('authRole');
    let data;

    if (rol === 'ADMIN' || rol === 'ROLE_ADMIN') {
      // ADMIN: endpoint con datos financieros
      const res = await axios.get('/api/finanzas/padres');
      data = res.data;
    } else {
      // EMPLEADO: endpoint /api/clientes filtrado por sede
      const res = await axios.get('/api/clientes');
      data = res.data;
    }

    padres.value = data.filter(padre => padre.estado === 'ACTIVO' || !padre.estado);
  } catch (error) { console.error(error); }
};



const enviarPadre = async () => {
  if (!formPadre.value.nombreCompleto || !formPadre.value.nombreCompleto.trim() || !formPadre.value.telefono) { 
    alert("⚠️ Completa todos los campos del padre."); 
    return; 
  }
  const { nombre, apellido } = splitNombreApellido(formPadre.value.nombreCompleto);
  try {
    await axios.post('/api/registro/padre', null, { 
      params: { nombre, apellido, telefono: formPadre.value.telefono } 
    });
    alert("✅ Padre registrado con exito");
    formPadre.value = { nombreCompleto: '', telefono: '' };
    cargarPadres();
  } catch (error) {
    if (error.response?.status === 401) return;
    const msg = error.response?.data?.mensaje || error.response?.data?.error || (typeof error.response?.data === 'string' ? error.response?.data : null) || "❌ Error al registrar el padre.";
    alert("⚠️ " + msg);
    console.error(error);
  }
};

const enviarDeportista = async () => {
  if (!formDeportista.value.parentId || !formDeportista.value.nombreCompleto || !formDeportista.value.nombreCompleto.trim()) {
    alert("⚠️ Completa el padre y el nombre del deportista.");
    return;
  }
  if (sedeIdsSeleccionados.value.length === 0) {
    alert("⚠️ Selecciona al menos una sede y su grupo.");
    return;
  }
  // Validar que todas las sedes tengan grupo seleccionado
  const sedesSinGrupo = sedeIdsSeleccionados.value.filter(sid => !nivelesPorSede.value[sid] || nivelesPorSede.value[sid] === '');
  if (sedesSinGrupo.length > 0) {
    alert('⚠️ Por favor selecciona un grupo para todas las sedes marcadas.');
    return;
  }
  const sedePrincipalEfectiva = sedePrincipalId.value || sedeIdsSeleccionados.value[0];
  // El Plan solo es obligatorio en la sede principal — ahí es donde se le cobra la mensualidad.
  const planPrincipal = clubConfig.value?.preciosDiferenciados
    ? planPorSede.value[sedePrincipalEfectiva]
    : planPorSede.value['global'];
  if (!planPrincipal) {
    alert('⚠️ Selecciona el Plan de la sede principal. Sin un plan, el deportista no queda con ningún cobro asignado.');
    return;
  }
  const matriculas = sedeIdsSeleccionados.value.map(sid => ({
    sedeId: sid,
    nivel: nivelesPorSede.value[sid],
    esPrincipal: sid === sedePrincipalEfectiva,
    planMensualidadId: sid === sedePrincipalEfectiva
      ? planPrincipal
      : (clubConfig.value?.preciosDiferenciados ? (planPorSede.value[sid] || null) : null)
  }));

  const { nombre, apellido } = splitNombreApellido(formDeportista.value.nombreCompleto);
  try {
    await axios.post('/api/registro/deportista', {
      parentId: formDeportista.value.parentId,
      nombre,
      apellido,
      edad: formDeportista.value.edad !== '' && formDeportista.value.edad != null ? Number(formDeportista.value.edad) : null,
      fechaNacimiento: formDeportista.value.fechaNacimiento || null,
      matriculas: matriculas
    });
    alert("✅ Deportista registrado con exito");
    formDeportista.value = { parentId: '', nombreCompleto: '', edad: '', fechaNacimiento: '' };
    textoBusquedaPadre.value = '';
    padreSeleccionado.value = null;
    mostrarDropdown.value = false;
    sedeIdsSeleccionados.value = [];
    nivelesPorSede.value = {};
    planPorSede.value = {};
    sedePrincipalId.value = null;
  } catch (error) {
    if (error.response?.status === 401) return;
    const msg = error.response?.data?.mensaje || error.response?.data?.error || (typeof error.response?.data === 'string' ? error.response?.data : null) || "❌ Error al registrar el deportista.";
    alert("⚠️ " + msg);
    console.error(error);
  }
};

const cargarClubConfig = async () => {
  try {
    const res = await axios.get('/api/config/cobro');
    clubConfig.value = res.data;
    if (!clubConfig.value?.preciosDiferenciados) {
      cargarTodosLosPlanes();
    }
  } catch (e) {
    console.error('Error al cargar config de cobro:', e);
  }
};

onMounted(() => { cargarPadres(); cargarSedes(); cargarClubConfig(); });
</script>
