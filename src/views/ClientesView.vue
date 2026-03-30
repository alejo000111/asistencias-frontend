<template>
  <div class="mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="mb-0">👥 Gestión de Clientes y Perfiles</h3>
    </div>

    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <button class="nav-link fw-bold" :class="{ 'active text-primary': pestanaActual === 'ACTIVOS', 'text-muted': pestanaActual !== 'ACTIVOS' }" @click="pestanaActual = 'ACTIVOS'">
          🟢 Clientes Activos
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link fw-bold" :class="{ 'active text-danger': pestanaActual === 'INACTIVOS', 'text-muted': pestanaActual !== 'INACTIVOS' }" @click="pestanaActual = 'INACTIVOS'">
          🔴 Clientes Inactivos
        </button>
      </li>
    </ul>

    <div v-if="pestanaActual === 'ACTIVOS'">
      <h5 class="text-danger border-bottom pb-2 mt-2">🔴 Tienen saldos pendientes</h5>
      <div class="row mt-3">
        <div class="col-md-6 mb-4" v-for="padre in padresActivosConDeuda" :key="padre.id">
          <TarjetaCliente 
            :padre="padre" 
            :activeFormType="currentOpenClientId === padre.id ? currentOpenFormType : null"
            @recargar="cargarPadres" 
            @toggleCardForm="onToggleCardForm" 
          />
        </div>
        <div v-if="padresActivosConDeuda.length === 0" class="text-muted mb-4">Nadie debe dinero. ¡Excelente!</div>
      </div>

      <h5 class="text-success border-bottom pb-2 mt-4">🟢 Al Día / Saldo a Favor</h5>
      <div class="row mt-3">
        <div class="col-md-6 mb-4" v-for="padre in padresActivosAlDia" :key="padre.id">
          <TarjetaCliente 
            :padre="padre" 
            :activeFormType="currentOpenClientId === padre.id ? currentOpenFormType : null"
            @recargar="cargarPadres" 
            @toggleCardForm="onToggleCardForm" 
          />
        </div>
        <div v-if="padresActivosAlDia.length === 0" class="text-muted">No hay clientes en esta categoría.</div>
      </div>
    </div>

    <div v-if="pestanaActual === 'INACTIVOS'">
      <div class="alert alert-secondary">
        Aquí aparecen los padres que han sido marcados como INACTIVOS. Puedes editarlos para reactivarlos en cualquier momento.
      </div>
      <div class="row mt-3">
        <div class="col-md-6 mb-4" v-for="padre in padresInactivos" :key="padre.id">
          <TarjetaCliente 
            :padre="padre" 
            :activeFormType="currentOpenClientId === padre.id ? currentOpenFormType : null"
            @recargar="cargarPadres" 
            @toggleCardForm="onToggleCardForm" 
          />
        </div>
        <div v-if="padresInactivos.length === 0" class="text-muted">No hay clientes inactivos.</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import TarjetaCliente from '../components/TarjetaCliente.vue';

const padres = ref([]);
const pestanaActual = ref('ACTIVOS');

const currentOpenClientId = ref(null);
const currentOpenFormType = ref(null); // 'abono', 'historial', o 'edit'

// Si se hace clic en el mismo formulario del mismo cliente, se cierra.
const onToggleCardForm = ({ clientId, formType }) => {
  if (currentOpenClientId.value === clientId && currentOpenFormType.value === formType) {
    // Si ya estaba abierto, ciérralo (comportamiento de "toggle")
    currentOpenClientId.value = null;
    currentOpenFormType.value = null;
  } else {
    // Si no, abre este nuevo y colapsa los demás automáticamente.
    currentOpenClientId.value = clientId;
    currentOpenFormType.value = formType;
  }
};

// Filtros Computados Mágicos (se mantienen igual)
const padresActivos = computed(() => padres.value.filter(p => p.estado === 'ACTIVO' || !p.estado));
const padresInactivos = computed(() => padres.value.filter(p => p.estado === 'INACTIVO'));

const padresActivosConDeuda = computed(() => padresActivos.value.filter(p => p.deudaTotal > 0));
const padresActivosAlDia = computed(() => padresActivos.value.filter(p => p.deudaTotal === 0));

const cargarPadres = async () => {
  try {
    const response = await axios.get('/api/finanzas/padres');
    
    padres.value = response.data.map(padre => {
      let deuda = 0;
      if (padre.students) {
        padre.students.forEach(hijo => {
          if (hijo.attendances) {
            hijo.attendances.forEach(clase => {
              if (!clase.clasePaga) deuda += clase.precioCobrado;
            });
          }
        });
      }
      return {
        ...padre,
        deudaTotal: deuda,
        estado: padre.estado || 'ACTIVO',
        nuevoAbono: '',
        metodoPago: 'TRANSFERENCIA'
      };
    });
  } catch (error) { console.error(error); }
};

onMounted(() => { cargarPadres(); });
</script>