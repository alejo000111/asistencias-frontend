<template>
  <div class="config-card">
    <h2 class="config-card__title">💳 Integración Wompi</h2>
    <p class="config-card__desc">
      Configura tus llaves de Wompi para permitir a los padres pagar en línea.
      Puedes encontrar estas llaves en el <a href="https://comercios.wompi.co" target="_blank">dashboard de Wompi</a>.
    </p>

    <form @submit.prevent="guardarConfiguracion" class="config-form mt-3">
      <div v-if="error" class="config-alert config-alert--danger mb-3">{{ error }}</div>
      <div v-if="exito" class="config-alert config-alert--success mb-3">✅ Configuración de Wompi actualizada.</div>

      <div class="config-field">
        <label for="wompi-env">Entorno *</label>
        <select id="wompi-env" v-model="form.wompiEnvironment" class="config-input">
          <option value="test">Pruebas (Test)</option>
          <option value="prod">Producción (Prod)</option>
        </select>
      </div>

      <div class="config-field">
        <label for="wompi-public">Llave Pública (Public Key) *</label>
        <input
          id="wompi-public"
          v-model="form.wompiPublicKey"
          type="text"
          class="config-input"
          placeholder="pub_test_..."
          required
        />
      </div>

      <div class="config-field">
        <label for="wompi-private">Llave Privada (Private Key) {{ privadaConfigurada ? '' : '*' }}</label>
        <input
          id="wompi-private"
          v-model="form.wompiPrivateKey"
          type="password"
          class="config-input"
          :placeholder="privadaConfigurada ? 'Ya configurada — déjalo vacío para no cambiarla' : 'prv_test_...'"
          :required="!privadaConfigurada"
          autocomplete="new-password"
        />
      </div>

      <div class="config-field">
        <label for="wompi-event">Secreto de Eventos (Event Secret) {{ eventoConfigurado ? '' : '*' }}</label>
        <input
          id="wompi-event"
          v-model="form.wompiEventSecret"
          type="password"
          class="config-input"
          :placeholder="eventoConfigurado ? 'Ya configurado — déjalo vacío para no cambiarlo' : 'Para validar Webhooks'"
          :required="!eventoConfigurado"
          autocomplete="new-password"
        />
        <small class="text-muted mt-1" style="font-size: 0.75rem;">
          URL de Eventos (Webhook) para configurar en Wompi: <br/>
          <code>https://tu-dominio.com/api/wompi/webhook</code>
        </small>
      </div>

      <button type="submit" class="btn-config-primary mt-2" :disabled="guardando">
        {{ guardando ? 'Guardando...' : '💾 Guardar Credenciales Wompi' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const form = ref({
  wompiEnvironment: 'test',
  wompiPublicKey: '',
  wompiPrivateKey: '',
  wompiEventSecret: ''
})

// El backend nunca devuelve la llave privada ni el secreto de eventos en texto plano — solo
// informa si ya están configurados, para no filtrarlos por la red/DevTools en cada carga.
const privadaConfigurada = ref(false)
const eventoConfigurado = ref(false)

const guardando = ref(false)
const error = ref('')
const exito = ref(false)

async function cargarConfiguracion() {
  try {
    const res = await axios.get('/api/config/cobro/wompi')
    if (res.data) {
      form.value.wompiEnvironment = res.data.wompiEnvironment || 'test'
      form.value.wompiPublicKey = res.data.wompiPublicKey || ''
      form.value.wompiPrivateKey = ''
      form.value.wompiEventSecret = ''
      privadaConfigurada.value = Boolean(res.data.wompiPrivateKeyConfigurada)
      eventoConfigurado.value = Boolean(res.data.wompiEventSecretConfigurado)
    }
  } catch (e) {
    console.error("Error cargando configuración Wompi", e)
  }
}

async function guardarConfiguracion() {
  error.value = ''
  exito.value = false
  guardando.value = true

  try {
    // Los campos de llave privada / secreto de eventos solo viajan si el admin escribió un
    // valor nuevo — dejarlos vacíos significa "no cambiar" (el backend los ignora en blanco).
    await axios.post('/api/config/cobro/wompi', form.value)
    exito.value = true
    if (form.value.wompiPrivateKey) privadaConfigurada.value = true
    if (form.value.wompiEventSecret) eventoConfigurado.value = true
    form.value.wompiPrivateKey = ''
    form.value.wompiEventSecret = ''
  } catch (e) {
    error.value = e.response?.data?.error || 'Error al guardar configuración de Wompi.'
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargarConfiguracion()
})
</script>

<style scoped>
.config-card {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-primary, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: var(--space-6, 24px);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1));
}
.config-card__title { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin: 0 0 4px; }
.config-card__desc { font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 16px; }

.config-form { display: flex; flex-direction: column; gap: 16px; max-width: 500px; }
.config-field { display: flex; flex-direction: column; gap: 4px; }
.config-field label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
.config-input {
  background: var(--input-bg, #fff);
  border: 1px solid var(--border-primary, #ccc);
  border-radius: 6px;
  color: var(--text-primary);
  padding: 10px 14px;
  font-size: 0.9rem;
}
.config-input:focus { outline: none; border-color: var(--orange-500, #f97316); }

.btn-config-primary {
  padding: 10px 22px;
  background: var(--orange-500, #f97316);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-config-primary:hover { background: var(--orange-600, #ea580c); }
.btn-config-primary:disabled { opacity: 0.7; cursor: not-allowed; }

.config-alert { padding: 10px 14px; border-radius: 6px; font-size: 0.85rem; font-weight: 500; }
.config-alert--danger { background: rgba(220, 38, 38, 0.1); color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.3); }
.config-alert--success { background: rgba(22, 163, 74, 0.12); color: #16a34a; border: 1px solid rgba(22, 163, 74, 0.3); }
</style>
