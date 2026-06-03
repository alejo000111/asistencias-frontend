<template>
  <div class="row mt-4">
    <h3 class="mb-4">📝 Inscripciones</h3>

    <div class="col-md-5 mb-4">
      <div class="card shadow-sm h-100 border-success">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0">👨‍👩‍👦 Registrar Padre / Acudiente</h5>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <label class="form-label">Nombre(s)</label>
            <input type="text" v-model="formPadre.nombre" class="form-control" placeholder="Ej: Carlos">
          </div>
          <div class="mb-3">
            <label class="form-label">Apellido</label>
            <input type="text" v-model="formPadre.apellido" class="form-control" placeholder="Ej: Perez">
          </div>
          <div class="mb-3">
            <label class="form-label">Teléfono</label>
            <input type="text" v-model="formPadre.telefono" class="form-control" placeholder="Ej: 3001234567">
          </div>
          <button @click="enviarPadre" class="btn btn-success w-100">Guardar Padre</button>
        </div>
      </div>
    </div>

    <div class="col-md-7 mb-4">
      <div class="card shadow-sm h-100 border-primary">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">🛼 Registrar Deportista</h5>
        </div>
        <div class="card-body">
          <div class="mb-3" style="position: relative;">
            <label class="form-label text-primary fw-bold">Buscar Padre / Acudiente</label>
            <input
              type="text"
              v-model="textoBusquedaPadre"
              class="form-control border-primary shadow-sm"
              placeholder="Escribe el nombre del padre..."
              @focus="abrirDropdown"
              @blur="setTimeout(() => mostrarDropdown = false, 200)"
            />
            <ul
              v-if="mostrarDropdown && padresFiltrados.length > 0"
              class="list-group position-absolute w-100 shadow-sm"
              style="z-index: 1000; max-height: 200px; overflow-y: auto; cursor: pointer;"
            >
              <li
                v-for="padre in padresFiltrados"
                :key="padre.id"
                class="list-group-item list-group-item-action py-2"
                @mousedown.prevent="seleccionarPadre(padre)"
              >
                {{ padre.nombreCompleto }}
              </li>
            </ul>
            <div v-if="padreSeleccionado" class="mt-1">
              <span class="badge bg-success fs-6 shadow-sm">✓ {{ padreSeleccionado.nombreCompleto }}</span>
            </div>
          </div>
          <div class="row">
            <div class="col-6 mb-3">
              <label class="form-label">Nombre(s)</label>
              <input type="text" v-model="formDeportista.nombre" class="form-control">
            </div>
            <div class="col-6 mb-3">
              <label class="form-label">Apellido</label>
              <input type="text" v-model="formDeportista.apellido" class="form-control">
            </div>
          </div>
          <div class="row align-items-end"> 
            <div class="col-6 mb-3">
              <label class="form-label">Fecha de Nacimiento</label>
              <input type="date" v-model="formDeportista.fechaNacimiento" @change="calcularEdad" class="form-control">
            </div>
            <div class="col-6 mb-3">
              <label class="form-label">Edad</label>
              <input type="number" v-model="formDeportista.edad" class="form-control bg-light text-primary fw-bold" readonly placeholder="Elige fecha">
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Nivel del Deportista</label>
            <select v-model="formDeportista.nivel" 
                    class="form-select fw-bold shadow-sm" 
                    :style="formDeportista.nivel === 'AVANZADO' ? 'background-color: #f97316; color: white; border-color: #cbd5e1;' : 'background-color: #10b981; color: white; border-color: #cbd5e1;'">
              <option value="INICIACIÓN" style="background-color: white; color: black;">🌱 Iniciación</option>
              <option value="AVANZADO" style="background-color: white; color: black;">🔥 Avanzado</option>
            </select>
          </div>
          <button @click="enviarDeportista" class="btn btn-primary w-100">Guardar Deportista</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';

const padres = ref([]);
const formPadre = ref({ nombre: '', apellido: '', telefono: '' });
const formDeportista = ref({ parentId: '', nombre: '', apellido: '', edad: '', fechaNacimiento: '', nivel: 'INICIACIÓN' });

// --- BÚSQUEDA DE PADRE CON DROPDOWN ---
const textoBusquedaPadre = ref('');
const padreSeleccionado = ref(null);
const mostrarDropdown = ref(false);

const padresFiltrados = computed(() => {
  const busqueda = textoBusquedaPadre.value.toLowerCase().trim();
  if (!busqueda) return [];
  return padres.value.filter(p =>
    p.nombreCompleto.toLowerCase().includes(busqueda)
  );
});

const seleccionando = ref(false);

const seleccionarPadre = (padre) => {
  seleccionando.value = true;
  padreSeleccionado.value = padre;
  textoBusquedaPadre.value = padre.nombreCompleto;
  formDeportista.value.parentId = padre.id;
  mostrarDropdown.value = false;
};

const abrirDropdown = () => {
  if (textoBusquedaPadre.value.trim().length > 0) {
    mostrarDropdown.value = true;
  }
};

watch(textoBusquedaPadre, (nuevoValor) => {
  if (seleccionando.value) {
    seleccionando.value = false;
    return;
  }
  if (!nuevoValor || nuevoValor.trim() === '') {
    padreSeleccionado.value = null;
    formDeportista.value.parentId = '';
    mostrarDropdown.value = false;
  } else {
    mostrarDropdown.value = true;
  }
});

const calcularEdad = () => {
  const fechaNac = formDeportista.value.fechaNacimiento;
  if (!fechaNac) return;

  const hoy = new Date();
  const cumpleanos = new Date(fechaNac);
  
  let edad = hoy.getFullYear() - cumpleanos.getFullYear();
  const mes = hoy.getMonth() - cumpleanos.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < cumpleanos.getDate())) {
    edad--;
  }

  formDeportista.value.edad = edad >= 0 ? edad : 0; 
};

const cargarPadres = async () => {
  try {
    const res = await axios.get('/api/finanzas/padres');
    padres.value = res.data.filter(padre => padre.estado === 'ACTIVO' || !padre.estado);
  } catch (error) { console.error(error); }
};

const enviarPadre = async () => {
  if (!formPadre.value.nombre || !formPadre.value.apellido || !formPadre.value.telefono) {
    alert("⚠️ Completa todos los campos del padre.");
    return;
  }
  try {
    await axios.post('/api/registro/padre', null, { params: formPadre.value });
    alert("✅ Padre registrado con éxito");
    formPadre.value = { nombre: '', apellido: '', telefono: '' };
    cargarPadres();
  } catch (error) { alert("❌ Error"); }
};

const enviarDeportista = async () => {
  if (!formDeportista.value.parentId || !formDeportista.value.nombre || !formDeportista.value.fechaNacimiento || formDeportista.value.edad === '') {
    alert("⚠️ Completa todos los campos. Asegúrate de elegir la fecha de nacimiento.");
    return;
  }
  try {
    await axios.post('/api/registro/deportista', null, { params: formDeportista.value });
    alert("✅ Deportista registrado con éxito");
    // Limpia el formulario Y la búsqueda del padre
    formDeportista.value = { parentId: '', nombre: '', apellido: '', edad: '', fechaNacimiento: '', nivel: 'INICIACIÓN' };
    textoBusquedaPadre.value = '';
    padreSeleccionado.value = null;
    mostrarDropdown.value = false;
  } catch (error) { alert("❌ Error"); }
};

onMounted(() => { cargarPadres(); });
</script>