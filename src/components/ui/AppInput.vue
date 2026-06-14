<template>
  <div class="app-input" :class="wrapperClasses">
    <label v-if="label" class="app-input__label" :for="inputId">
      {{ label }}
      <span v-if="required" class="app-input__required">*</span>
    </label>

    <div class="app-input__container">
      <span v-if="iconLeft" class="app-input__icon app-input__icon--left">{{ iconLeft }}</span>

      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        class="app-input__field"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
        v-bind="$attrs"
      />

      <span v-if="iconRight" class="app-input__icon app-input__icon--right">{{ iconRight }}</span>
    </div>

    <p v-if="hint && !error" class="app-input__hint">{{ hint }}</p>
    <p v-if="error" class="app-input__error">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  variant: {
    type: String,
    default: 'default',
    validator: v => ['default', 'filled'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v)
  },
  iconLeft: { type: String, default: '' },
  iconRight: { type: String, default: '' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
})

defineEmits(['update:modelValue', 'blur', 'focus'])

const inputId = useId()

const wrapperClasses = computed(() => [
  `app-input--${props.variant}`,
  `app-input--${props.size}`,
  {
    'app-input--error': props.error,
    'app-input--disabled': props.disabled,
    'app-input--has-icon-left': props.iconLeft,
    'app-input--has-icon-right': props.iconRight,
  }
])
</script>

<style scoped>
.app-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
}

/* ——— Label ——— */
.app-input__label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.4;
}

.app-input__required {
  color: var(--color-danger);
  margin-left: 2px;
}

/* ——— Input Container ——— */
.app-input__container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

/* ——— Input Field ——— */
.app-input__field {
  width: 100%;
  font-family: var(--font-sans);
  font-weight: 400;
  line-height: 1.5;
  color: var(--text-primary);
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: var(--radius-md);
  outline: none;
  transition: all var(--transition-fast);
}

.app-input__field::placeholder {
  color: var(--input-placeholder);
}

.app-input__field:focus {
  border-color: var(--orange-500);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
}

/* ——— Tamaños ——— */
.app-input--sm .app-input__field {
  padding: 6px 12px;
  font-size: 0.8125rem;
}

.app-input--md .app-input__field {
  padding: 10px 14px;
  font-size: 0.875rem;
}

.app-input--lg .app-input__field {
  padding: 14px 18px;
  font-size: 1rem;
}

/* ——— Variante FILLED ——— */
.app-input--filled .app-input__field {
  background: var(--gray-100);
  border-color: transparent;
}

.app-input--filled .app-input__field:focus {
  background: var(--color-white);
  border-color: var(--orange-500);
}

[data-theme="dark"] .app-input--filled .app-input__field {
  background: var(--gray-800);
}

[data-theme="dark"] .app-input--filled .app-input__field:focus {
  background: var(--gray-700);
}

/* ——— Estado ERROR ——— */
.app-input--error .app-input__field {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.10);
}

.app-input--error .app-input__field:focus {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.18);
}

.app-input__error {
  font-size: 0.75rem;
  color: var(--color-danger);
  line-height: 1.4;
}

/* ——— Hint ——— */
.app-input__hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  line-height: 1.4;
}

/* ——— Iconos ——— */
.app-input__icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  line-height: 1;
  color: var(--text-tertiary);
  pointer-events: none;
  z-index: 1;
}

.app-input__icon--left {
  left: 12px;
}

.app-input__icon--right {
  right: 12px;
}

.app-input--has-icon-left .app-input__field {
  padding-left: 40px;
}

.app-input--has-icon-right .app-input__field {
  padding-right: 40px;
}

/* ——— Disabled ——— */
.app-input--disabled {
  opacity: 0.55;
}

.app-input--disabled .app-input__field {
  cursor: not-allowed;
}
</style>
