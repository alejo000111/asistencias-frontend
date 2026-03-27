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
            <label class="form-label">Apellido(s)</label>
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
          <div class="mb-3">
            <label class="form-label text-primary fw-bold">Seleccionar Padre</label>
            <select v-model="formDeportista.parentId" class="form-select border-primary">
              <option value="" disabled>Seleccione un padre...</option>
              <option v-for="padre in padres" :key="padre.id" :value="padre.id">
                {{ padre.nombreCompleto }}
              </option>
            </select>
          </div>
          <div class="row">
            <div class="col-6 mb-3">
              <label class="form-label">Nombre(s)</label>
              <input type="text" v-model="formDeportista.nombre" class="form-control">
            </div>
            <div class="col-6 mb-3">
              <label class="form-label">Apellido(s)</label>
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
import { ref, onMounted } from 'vue';
import axios from 'axios';

const padres = ref([]);
const formPadre = ref({ nombre: '', apellido: '', telefono: '' });
const formDeportista = ref({ parentId: '', nombre: '', apellido: '', edad: '', fechaNacimiento: '', nivel: 'INICIACIÓN' });

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
    const res = await axios.get('http://localhost:8080/api/finanzas/padres');
    padres.value = res.data.filter(padre => padre.estado === 'ACTIVO' || !padre.estado);
  } catch (error) { console.error(error); }
};

const enviarPadre = async () => {
  if (!formPadre.value.nombre || !formPadre.value.apellido || !formPadre.value.telefono) {
    alert("⚠️ Completa todos los campos del padre.");
    return;
  }
  try {
    await axios.post('http://localhost:8080/api/registro/padre', null, { params: formPadre.value });
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
    await axios.post('http://localhost:8080/api/registro/deportista', null, { params: formDeportista.value });
    alert("✅ Deportista registrado con éxito");
    // Al limpiar el form, volvemos a poner 'INICIACIÓN' por defecto para que no quede en blanco
    formDeportista.value = { parentId: '', nombre: '', apellido: '', edad: '', fechaNacimiento: '', nivel: 'INICIACIÓN' };
  } catch (error) { alert("❌ Error"); }
};

onMounted(() => { cargarPadres(); });
</script>