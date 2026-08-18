<template>
  <div class="wompi-widget-container">
    <div v-if="cargando" class="text-center py-3">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">Iniciando pasarela de pago...</p>
    </div>
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    <div v-else>
      <button 
        v-if="!widgetAbierto" 
        @click="abrirWidget" 
        class="btn btn-primary w-100 py-3 fw-bold fs-5 shadow-sm rounded-3 d-flex align-items-center justify-content-center gap-2"
        style="background: linear-gradient(135deg, #0241B0, #002266); border: none;"
      >
        <span>💳</span> Pagar con Wompi
      </button>
      <div v-else class="alert alert-info text-center">
        Procesando pago con Wompi...
        <br/>
        <small>Si cerraste la ventana, actualiza la página.</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
  monto: {
    type: Number,
    required: true
  },
  clubId: {
    type: Number,
    required: true
  },
  secretToken: {
    type: String,
    required: true
  }
})

const cargando = ref(false)
const error = ref('')
const widgetAbierto = ref(false)

async function abrirWidget() {
  if (props.monto <= 0) {
    error.value = "El monto a pagar debe ser mayor a 0."
    return
  }

  cargando.value = true
  error.value = ''

  try {
    // 1. Solicitar inicialización de transacción al backend
    const response = await axios.post('/api/wompi/transaction/init', {
      clubId: props.clubId,
      secretToken: props.secretToken,
      amount: props.monto,
      currency: 'COP'
    })

    const data = response.data

    // 2. Configurar y abrir el widget de Wompi
    const checkout = new WidgetCheckout({
      currency: data.currency,
      amountInCents: data.amountInCents,
      reference: data.reference,
      publicKey: data.publicKey,
      signature: data.signature ? { integrity: data.signature } : undefined
    })

    checkout.open(function (result) {
      var transaction = result.transaction
      if (transaction.status === 'APPROVED') {
        alert('Pago aprobado. Tu estado de cuenta se actualizará en breve.')
        window.location.reload()
      } else {
        alert('El pago no fue aprobado. Estado: ' + transaction.status)
        widgetAbierto.value = false
      }
    })

    widgetAbierto.value = true

  } catch (e) {
    // Este widget vive en el Portal de Padres (página pública, sin sesión) — nunca se le debe
    // mostrar al padre el detalle técnico del error (podría confundirlo o exponer información
    // interna). El motivo real queda en el log del servidor para que el admin/soporte lo revise.
    console.error("Error iniciando Wompi", e)
    error.value = "Hubo un problema para iniciar tu pago. Por favor contacta al administrador de tu club/escuela para que lo revise — no se realizó ningún cobro."
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  // Asegurar que el script de Wompi esté cargado
  if (!document.getElementById('wompi-script')) {
    const script = document.createElement('script')
    script.id = 'wompi-script'
    script.src = 'https://checkout.wompi.co/widget.js'
    document.body.appendChild(script)
  }
})
</script>

<style scoped>
.wompi-widget-container {
  margin-top: 1rem;
}
</style>
