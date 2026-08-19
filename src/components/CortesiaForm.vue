<template>
  <div class="cortesia-form">
    <div class="cortesia-form__row">
      <div class="cortesia-form__field">
        <label class="cortesia-form__label">Nombre del Acudiente *</label>
        <input
          :id="'cortesia-acudiente-' + idx"
          v-model="local.nombreAcudiente"
          type="text"
          class="form-control"
          placeholder="Ej: María Pérez"
        />
      </div>
      <div class="cortesia-form__field">
        <label class="cortesia-form__label">Teléfono del Acudiente *</label>
        <input
          :id="'cortesia-telefono-' + idx"
          v-model="local.telefonoAcudiente"
          type="tel"
          class="form-control"
          placeholder="Ej: 3001234567"
        />
        <small class="cortesia-form__note">Si ya es un acudiente registrado, los deportistas se agregan a su familia.</small>
      </div>
    </div>

    <div class="cortesia-form__deportistas">
      <label class="cortesia-form__label d-block mb-1">
        Deportista(s) *
        <span class="cortesia-form__nivel-heredado">
          — Nivel/Grupo: {{ nivelActual ? nivelActual : 'Sin nivel específico' }}
        </span>
      </label>
      <div v-for="(d, di) in local.deportistas" :key="di" class="cortesia-form__deportista-row">
        <input
          v-model="d.nombreDeportista"
          type="text"
          class="form-control"
          placeholder="Ej: Juan Pérez"
        />
        <button v-if="local.deportistas.length > 1" type="button" class="cortesia-form__btn-quitar-fila" @click="quitarDeportista(di)" title="Quitar este deportista">✖</button>
      </div>
      <button type="button" class="btn btn-sm btn-outline-secondary mt-2" @click="agregarDeportista">
        ➕ Agregar Hermano/a
      </button>
    </div>

    <div v-if="showRemove" class="cortesia-form__actions">
      <button type="button" class="btn btn-sm btn-outline-danger" @click="$emit('remove')">
        🗑️ Quitar esta cortesía
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  // Nivel/grupo de la clase que se está registrando ahora mismo — la cortesía SIEMPRE lo
  // hereda (no se puede anotar con el nivel de otro grupo distinto al que se está llenando).
  nivelActual: { type: String, default: '' },
  idx: { type: [Number, String], default: 0 },
  showRemove: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'remove']);

const local = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const agregarDeportista = () => {
  local.value.deportistas.push({ nombreDeportista: '' });
};

const quitarDeportista = (idx) => {
  local.value.deportistas.splice(idx, 1);
};
</script>

<style scoped>
.cortesia-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3, 12px);
  margin-bottom: var(--space-3, 12px);
}

@media (max-width: 640px) {
  .cortesia-form__row {
    grid-template-columns: 1fr;
  }
}

.cortesia-form__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cortesia-form__label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.cortesia-form__note {
  font-size: 0.76rem;
  color: var(--text-secondary, #6b7280);
}

.cortesia-form__deportistas {
  border-top: 1px dashed var(--border-primary, #e5e7eb);
  padding-top: var(--space-3, 12px);
}

.cortesia-form__nivel-heredado {
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
}

.cortesia-form__deportista-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

@media (max-width: 640px) {
  .cortesia-form__deportista-row {
    grid-template-columns: 1fr;
  }
}

.cortesia-form__btn-quitar-fila {
  background: none;
  border: 1px solid var(--border-primary, #e5e7eb);
  color: #991b1b;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  flex-shrink: 0;
}
.cortesia-form__btn-quitar-fila:hover {
  background: #fef2f2;
  border-color: #fecaca;
}

.cortesia-form__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-3, 12px);
}
</style>
