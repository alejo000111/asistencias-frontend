<!-- src/components/CompraPaqueteForm.vue -->
<template>
  <div class="cpf-wrap">
    <!-- Paso 1: Seleccionar paquete -->
    <div v-if="!compraRealizada">
      <h5 class="cpf-title">📦 Compra de Paquete</h5>

      <!-- Cargando -->
      <div v-if="cargando" class="cpf-loading">⏳ Cargando paquetes...</div>

      <!-- Sin paquetes -->
      <div v-else-if="paquetes.length === 0" class="cpf-empty">
        ⚠️ El administrador aún no ha configurado paquetes. Ve a "Ajustes de Cobros" para crearlos.
      </div>

      <!-- Lista de paquetes -->
      <div v-else>
        <label class="cpf-label">Selecciona un paquete:</label>
        <div class="cpf-paquetes-list">
          <div
            v-for="p in paquetes"
            :key="p.id"
            class="cpf-paquete-card"
            :class="{ 'cpf-paquete-card--selected': paqueteSeleccionado?.id === p.id }"
            @click="paqueteSeleccionado = p"
          >
            <div class="cpf-paquete-nombre">{{ p.nombre }}</div>
            <div class="cpf-paquete-meta">
              <span class="cpf-badge cpf-badge--clases">🎟️ {{ p.clasesIncluidas }} clases</span>
              <span class="cpf-badge cpf-badge--precio">💰 ${{ formatearDinero(p.precio) }}</span>
            </div>
          </div>
        </div>

        <!-- Detalle paquete seleccionado -->
        <div v-if="paqueteSeleccionado" class="cpf-detalle">
          <p><strong>Paquete:</strong> {{ paqueteSeleccionado.nombre }}</p>
          <p><strong>Clases incluidas:</strong> {{ paqueteSeleccionado.clasesIncluidas }}</p>
          <p><strong>Precio:</strong> ${{ formatearDinero(paqueteSeleccionado.precio) }}</p>
        </div>

        <div class="row g-2 mb-3">
          <div class="col-12 col-md-6">
            <label class="cpf-label">Método de pago:</label>
            <select v-model="metodoPago" class="form-select form-select-sm">
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>
        </div>

        <button
          @click="registrarCompra"
          :disabled="!paqueteSeleccionado || procesando"
          class="app-btn app-btn--primary app-btn--sm cpf-btn-full"
        >
          {{ procesando ? '⏳ Registrando...' : '✅ Confirmar Compra de Paquete' }}
        </button>
      </div>
    </div>

    <!-- Paso 2: Compra realizada → mostrar resumen de pago completado -->
    <div v-else class="cpf-exito">
      <div class="cpf-exito-icon">🎉</div>
      <h5 class="cpf-title">¡Pago de Paquete Registrado!</h5>
      <div class="cpf-resumen">
        <p><strong>Paquete:</strong> {{ paqueteSeleccionado.nombre }}</p>
        <p><strong>Clases acreditadas:</strong> {{ paqueteSeleccionado.clasesIncluidas }}</p>
        <p><strong>Monto pagado:</strong> ${{ formatearDinero(paqueteSeleccionado.precio) }}</p>
        <p><strong>Método de pago:</strong> {{ metodoPago === 'TRANSFERENCIA' ? 'Transferencia' : 'Efectivo' }}</p>
      </div>
      <p class="cpf-hint text-success fw-bold" style="font-size: 0.9rem;">
        ✅ El pago de ${{ formatearDinero(paqueteSeleccionado.precio) }} ha ingresado a Caja y las {{ paqueteSeleccionado.clasesIncluidas }} clases fueron acreditadas.
      </p>

      <button @click="emit('cerrar')" class="app-btn app-btn--primary app-btn--sm cpf-btn-full" style="margin-top: 12px;">
        Entendido / Cerrar
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { formatearDinero, formatearMontoInput } from '@/utils/formatters';

const props = defineProps({ padre: { type: Object, required: true } });
const emit = defineEmits(['recargar', 'cerrar', 'notificar']);

const cargando = ref(true);
const procesando = ref(false);
const procesandoAbono = ref(false);
const paquetes = ref([]);
const paqueteSeleccionado = ref(null);
const compraRealizada = ref(false);

const sedeIdCliente = () => props.padre.sedeId || (props.padre.students?.[0]?.matriculas?.[0]?.sede?.id) || null;

const normalizarPaquetes = (lista, sedeId = null, preciosDiferenciados = false) => {
  if (!Array.isArray(lista)) return [];

  return lista
    .map((p, index) => {
      const precioSede = preciosDiferenciados && sedeId && p?.preciosSedes
        ? (p.preciosSedes[String(sedeId)] ?? p.preciosSedes[sedeId])
        : null;
      const precio = precioSede != null ? precioSede : p?.precio;

      if (!p?.nombre || p?.clases == null || precio == null) return null;

      return {
        id: p.id ?? `cfg-${index}`,
        nombre: p.nombre,
        clasesIncluidas: Number(p.clases),
        precio: Number(precio)
      };
    })
    .filter(Boolean);
};

// Abono
const montoAbono = ref(null);
const metodoPago = ref('EFECTIVO');
const fechaAbono = ref(new Date().toISOString().split('T')[0]);

// Cargar paquetes configurados por el admin
onMounted(async () => {
  try {
    const sedeId = sedeIdCliente();

    const configRes = await axios.get('/api/config/cobro');
    const config = configRes.data || {};
    let paquetesConfig = [];

    if (config.paquetesClasesJson) {
      try {
        paquetesConfig = normalizarPaquetes(
          JSON.parse(config.paquetesClasesJson),
          sedeId,
          Boolean(config.preciosDiferenciados)
        );
      } catch (e) {
        paquetesConfig = [];
      }
    }

    if (paquetesConfig.length === 0) {
      const res = await axios.get('/api/paquetes', {
        params: {
          parentId: props.padre.id,
          sedeId
        }
      });
      paquetesConfig = normalizarPaquetes(res.data || [], sedeId, false);
    }

    paquetes.value = paquetesConfig;
    if (paquetes.value.length > 0) {
      paqueteSeleccionado.value = paquetes.value[0];
    }
  } catch (e) {
    emit('notificar', { tipo: 'danger', titulo: 'Error', mensaje: 'No se pudieron cargar los paquetes del admin.' });
  } finally {
    cargando.value = false;
  }
});

const parseMonto = (val) => {
  if (!val) return null;
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || null;
};

const registrarCompra = async () => {
  if (!paqueteSeleccionado.value) return;
  procesando.value = true;
  try {
    const paqueteId = Number.isFinite(Number(paqueteSeleccionado.value.id))
      ? Number(paqueteSeleccionado.value.id)
      : null;

    await axios.post('/api/finanzas/compra-paquete', {
      parentId: props.padre.id,
      paqueteId,
      nombrePaquete: paqueteSeleccionado.value.nombre,
      clasesIncluidas: paqueteSeleccionado.value.clasesIncluidas,
      precio: paqueteSeleccionado.value.precio,
      sedeId: sedeIdCliente(),
      metodoPago: metodoPago.value
    });
    compraRealizada.value = true;
    montoAbono.value = paqueteSeleccionado.value.precio;
    emit('notificar', { tipo: 'success', titulo: 'Paquete Registrado', mensaje: `Se acreditaron ${paqueteSeleccionado.value.clasesIncluidas} clases al cliente.` });
    emit('recargar');
  } catch (e) {
    const msg = e.response?.data?.mensaje || e.response?.data?.error || 'Error al registrar la compra.';
    emit('notificar', { tipo: 'danger', titulo: 'Error', mensaje: msg });
  } finally {
    procesando.value = false;
  }
};

const enviarAbono = async () => {
  if (!montoAbono.value || montoAbono.value <= 0) {
    emit('notificar', { tipo: 'warning', titulo: 'Monto inválido', mensaje: 'Ingresa un monto mayor a cero.' });
    return;
  }
  procesandoAbono.value = true;
  try {
    await axios.post('/api/finanzas/abono', null, {
      params: { parentId: props.padre.id, monto: montoAbono.value, metodoPago: metodoPago.value, fecha: fechaAbono.value }
    });
    emit('notificar', { tipo: 'success', titulo: 'Abono Registrado', mensaje: 'El abono se aplicó correctamente.' });
    emit('recargar');
    emit('cerrar');
  } catch (e) {
    const msg = e.response?.data?.mensaje || e.response?.data?.error || 'Error al registrar el abono.';
    emit('notificar', { tipo: 'danger', titulo: 'Error', mensaje: msg });
  } finally {
    procesandoAbono.value = false;
  }
};
</script>

<style scoped>
.cpf-wrap {
  padding: 16px;
  background: var(--card-bg);
  color: var(--text-primary);
}
.cpf-title {
  font-weight: 700;
  margin-bottom: 12px;
  font-size: 1rem;
  color: var(--text-primary);
}
.cpf-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 4px;
}
.cpf-loading, .cpf-empty {
  color: var(--text-secondary);
  font-size: 0.85rem;
  padding: 12px 0;
}
.cpf-paquetes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  max-height: 220px;
  overflow-y: auto;
}
.cpf-paquete-card {
  border: 1.5px solid var(--border-primary);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  background: var(--bg-primary);
}
.cpf-paquete-card:hover {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.08);
}
.cpf-paquete-card--selected {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.15);
}
.cpf-paquete-nombre {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 4px;
  color: var(--text-primary);
}
.cpf-paquete-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.cpf-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}
.cpf-badge--clases {
  background: rgba(37, 99, 235, 0.15);
  color: #60a5fa;
}
.cpf-badge--precio {
  background: rgba(22, 163, 74, 0.15);
  color: #4ade80;
}
.cpf-detalle {
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
  font-size: 0.85rem;
  color: var(--text-primary);
}
.cpf-detalle p {
  margin: 2px 0;
}
.cpf-btn-full {
  width: 100%;
  margin-top: 4px;
}
.cpf-exito {
  text-align: center;
}
.cpf-exito-icon {
  font-size: 2rem;
  margin-bottom: 4px;
}
.cpf-resumen {
  background: rgba(22, 163, 74, 0.12);
  border: 1px solid rgba(22, 163, 74, 0.35);
  border-radius: 8px;
  padding: 10px 14px;
  margin: 10px 0;
  font-size: 0.85rem;
  text-align: left;
  color: var(--text-primary);
}
.cpf-resumen p { margin: 2px 0; }
.cpf-hint {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.cpf-abono-wrap {
  text-align: left;
}

/* ——— Móvil: evitar zoom automático en selects/inputs y mejorar toque ——— */
@media (max-width: 576px) {
  .cpf-wrap {
    padding: 12px;
  }
  .cpf-wrap :deep(.form-select) {
    font-size: 16px;
  }
  .cpf-paquete-card {
    padding: 12px;
  }
  .cpf-paquetes-list {
    max-height: 260px;
  }
  .cpf-btn-full {
    padding-top: 10px;
    padding-bottom: 10px;
    font-size: 0.95rem;
  }
}
</style>
