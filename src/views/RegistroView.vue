<template>
  <div class="row align-items-start">
    <h3 class="mb-4 mt-0">📝 Inscripciones</h3>
    <div class="col-md-5 mb-4">
      <div class="card shadow-sm border-success">
        <div class="card-header bg-success text-white"><h5 class="mb-0">👨‍👩‍👦 Registrar Padre / Acudiente</h5></div>
        <div class="card-body">
          <div class="mb-3"><label class="form-label">Nombre(s)</label><input type="text" v-model="formPadre.nombre" class="form-control" placeholder="Ej: Carlos"></div>
          <div class="mb-3"><label class="form-label">Apellido</label><input type="text" v-model="formPadre.apellido" class="form-control" placeholder="Ej: Perez"></div>
          <div class="mb-3"><label class="form-label">Telefono</label><input type="text" v-model="formPadre.telefono" class="form-control" placeholder="Ej: 3001234567"></div>
          <button @click="enviarPadre" class="btn btn-success w-100">Guardar Padre</button>
        </div>
      </div>
    </div>
    <div class="col-md-7 mb-4">
      <div class="card shadow-sm h-100 border-primary">
        <div class="card-header bg-primary text-white"><h5 class="mb-0">🛼 Registrar Deportista</h5></div>
        <div class="card-body">
          <div class="mb-3" style="position: relative;">
            <label class="form-label text-primary fw-bold">Buscar Padre / Acudiente</label>
            <input type="text" v-model="textoBusquedaPadre" class="form-control border-primary shadow-sm" placeholder="Escribe el nombre del padre..." @focus="abrirDropdown" @blur="setTimeout(() => mostrarDropdown = false, 200)" />
            <ul v-if="mostrarDropdown && padresFiltrados.length > 0" class="list-group position-absolute w-100 shadow-sm" style="z-index: 1000; max-height: 200px; overflow-y: auto; cursor: pointer;">
              <li v-for="padre in padresFiltrados" :key="padre.id" class="list-group-item list-group-item-action py-2" @mousedown.prevent="seleccionarPadre(padre)">{{ padre.nombreCompleto }}</li>
            </ul>
            <div v-if="padreSeleccionado" class="mt-1"><span class="badge bg-success fs-6 shadow-sm">✓ {{ padreSeleccionado.nombreCompleto }}</span></div>
          </div>
          <div class="row">
            <div class="col-6 mb-3"><label class="form-label">Nombre(s)</label><input type="text" v-model="formDeportista.nombre" class="form-control"></div>
            <div class="col-6 mb-3"><label class="form-label">Apellido</label><input type="text" v-model="formDeportista.apellido" class="form-control"></div>
          </div>
          <div class="row align-items-end">
            <div class="col-6 mb-3"><label class="form-label">Fecha de Nacimiento</label><input type="date" v-model="formDeportista.fechaNacimiento" @change="calcularEdad" class="form-control"></div>
            <div class="col-6 mb-3"><label class="form-label">Edad</label><input type="number" v-model="formDeportista.edad" class="form-control bg-light text-primary fw-bold" readonly placeholder="Elige fecha"></div>
          </div>
          <div class="mt-3">
            <label class="form-label fw-bold text-primary">Sedes / Grupos:</label>
            <div v-for="s in sedesDisponibles.filter(s => s.activa !== false)" :key="s.id" class="mb-2 border-bottom pb-1">
              <div class="form-check">
                <input type="checkbox" :id="'reg-sede-' + s.id" :value="s.id" v-model="sedeIdsSeleccionados" class="form-check-input" @change="toggleSede(s.id)">
                <label :for="'reg-sede-' + s.id" class="form-check-label fw-bold small">{{ s.nombre }}</label>
              </div>
              <select v-if="sedeIdsSeleccionados.includes(s.id)" v-model="nivelesPorSede[s.id]" class="form-select form-select-sm mt-1 fw-bold" style="max-width: 200px;">
                <option value="" disabled>Selecciona grupo...</option>
                <template v-for="g in (s.grupos || [])" :key="g.nombre">
                  <option v-if="g && g.nombre && g.nombre.trim() !== ''" :value="(g.emoji || '') + ' ' + g.nombre">{{ g.emoji ? g.emoji + ' ' : '' }}{{ g.nombre }}</option>
                </template>
              </select>
            </div>
          </div>
          <button @click="enviarDeportista" class="btn btn-primary w-100 mt-3">Guardar Deportista</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';

const padres = ref([]);
const sedesDisponibles = ref([]);
const sedeIdsSeleccionados = ref([]);
const nivelesPorSede = ref({});
const formPadre = ref({ nombre: '', apellido: '', telefono: '' });
const formDeportista = ref({ parentId: '', nombre: '', apellido: '', edad: '', fechaNacimiento: '' });

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
    const res = await axios.get('/api/finanzas/padres');
    padres.value = res.data.filter(padre => padre.estado === 'ACTIVO' || !padre.estado);
  } catch (error) { console.error(error); }
};

const cargarSedes = async () => {
  try {
    const res = await axios.get('/api/sedes');
    sedesDisponibles.value = res.data;
  } catch (error) { console.error(error); }
};

const enviarPadre = async () => {
  if (!formPadre.value.nombre || !formPadre.value.apellido || !formPadre.value.telefono) { alert("⚠️ Completa todos los campos del padre."); return; }    try {
      await axios.post('/api/registro/padre', null, { params: formPadre.value });
      alert("✅ Padre registrado con exito");
      formPadre.value = { nombre: '', apellido: '', telefono: '' };
      cargarPadres();
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) return; // interceptor ya maneja esto
      alert(error.response?.data || "❌ Error al registrar el padre. Revisa la consola.");
      console.error(error);
    }
};

const enviarDeportista = async () => {
  if (!formDeportista.value.parentId || !formDeportista.value.nombre || !formDeportista.value.fechaNacimiento || formDeportista.value.edad === '') {
    alert("⚠️ Completa todos los campos.");
    return;
  }
  // Validar que todas las sedes tengan grupo seleccionado
  const sedesSinGrupo = sedeIdsSeleccionados.value.filter(sid => !nivelesPorSede.value[sid] || nivelesPorSede.value[sid] === '');
  if (sedesSinGrupo.length > 0) {
    alert('⚠️ Por favor selecciona un grupo para todas las sedes marcadas.');
    return;
  }
  const matriculas = [];
  sedeIdsSeleccionados.value.forEach(sid => {
    matriculas.push({ sedeId: sid, nivel: nivelesPorSede.value[sid] });
  });
  if (matriculas.length === 0) { alert("⚠️ Selecciona al menos una sede y su grupo."); return; }    try {
      await axios.post('/api/registro/deportista', {
        parentId: formDeportista.value.parentId,
        nombre: formDeportista.value.nombre,
        apellido: formDeportista.value.apellido,
        edad: formDeportista.value.edad,
        fechaNacimiento: formDeportista.value.fechaNacimiento,
        matriculas: matriculas
      });
      alert("✅ Deportista registrado con exito");
      formDeportista.value = { parentId: '', nombre: '', apellido: '', edad: '', fechaNacimiento: '' };
      textoBusquedaPadre.value = '';
      padreSeleccionado.value = null;
      mostrarDropdown.value = false;
      sedeIdsSeleccionados.value = [];
      nivelesPorSede.value = {};
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) return; // interceptor ya maneja esto
      const msg = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response?.data : null) || "❌ Error al registrar el deportista. Revisa la consola.";
      alert(msg);
      console.error(error);
    }
};

onMounted(() => { cargarPadres(); cargarSedes(); });
</script>
