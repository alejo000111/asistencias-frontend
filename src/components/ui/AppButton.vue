<template>
  <component
    :is="tag"
    :type="tag === 'button' ? nativeType : undefined"
    :class="btnClasses"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="app-btn__spinner" />
    <span v-else-if="icon && !$slots.default" class="app-btn__icon">{{ icon }}</span>
    <span v-if="$slots.default || (!icon && !loading)" class="app-btn__text">
      <slot />
    </span>
    <span v-if="iconRight && !loading" class="app-btn__icon app-btn__icon--right">{{ iconRight }}</span>
  </component>
</template>

<script setup>
import { computed, useSlots } from 'vue'

const slots = useSlots()

const props = defineProps({
  /* Variante visual */
  variant: {
    type: String,
    default: 'primary',
    validator: v => ['primary', 'secondary', 'outline', 'ghost', 'danger'].includes(v)
  },
  /* Tamaños */
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v)
  },
  /* Icono izquierdo (emoji o texto) */
  icon: { type: String, default: '' },
  /* Icono derecho */
  iconRight: { type: String, default: '' },
  /* Estados */
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  /* Si es un enlace, pasar 'a' o 'RouterLink' */
  tag: { type: [String, Object], default: 'button' },
  /* type del botón */
  nativeType: { type: String, default: 'button' },
})

defineEmits(['click'])

const btnClasses = computed(() => [
  'app-btn',
  `app-btn--${props.variant}`,
  `app-btn--${props.size}`,
  {
    'app-btn--disabled': props.disabled,
    'app-btn--loading': props.loading,
    'app-btn--icon-only': props.icon && !slots.default && !props.loading
  }
])
</script>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-weight: 500;
  line-height: 1;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  user-select: none;
  text-decoration: none;
}

.app-btn:focus-visible {
  outline: 2px solid var(--orange-500);
  outline-offset: 2px;
}

/* ——— Tamaños ——— */
.app-btn--sm {
  padding: 6px 12px;
  font-size: 0.8125rem;
  gap: var(--space-1);
}

.app-btn--md {
  padding: 10px 18px;
  font-size: 0.875rem;
}

.app-btn--lg {
  padding: 14px 24px;
  font-size: 1rem;
}

/* Touch target mínimo 44px en mobile */
@media (max-width: 768px) {
  .app-btn--sm {
    min-height: 44px;
    min-width: 44px;
  }
  .app-btn--md {
    min-height: 44px;
    min-width: 44px;
  }
  .app-btn--lg {
    min-height: 48px;
    min-width: 48px;
  }
}

/* ========================================
   VARIANTES
   ======================================== */

/* ——— PRIMARY (Naranja) ——— */
.app-btn--primary {
  background: var(--orange-500);
  color: var(--color-white);
  border-color: var(--orange-500);
}

.app-btn--primary:hover:not(:disabled) {
  background: var(--orange-600);
  border-color: var(--orange-600);
  box-shadow: var(--shadow-md);
}

.app-btn--primary:active:not(:disabled) {
  background: var(--orange-700);
  transform: translateY(0.5px);
}

/* ——— SECONDARY (Gris oscuro) ——— */
.app-btn--secondary {
  background: var(--gray-800);
  color: var(--color-white);
  border-color: var(--gray-800);
}

.app-btn--secondary:hover:not(:disabled) {
  background: var(--gray-900);
  box-shadow: var(--shadow-md);
}

.app-btn--secondary:active:not(:disabled) {
  background: var(--gray-700);
  transform: translateY(0.5px);
}

/* ——— OUTLINE ——— */
.app-btn--outline {
  background: transparent;
  color: var(--text-primary);
  border-color: var(--border-primary);
}

.app-btn--outline:hover:not(:disabled) {
  background: var(--gray-50);
  border-color: var(--gray-300);
}

.app-btn--outline:active:not(:disabled) {
  background: var(--gray-100);
}

[data-theme="dark"] .app-btn--outline:hover:not(:disabled) {
  background: var(--gray-800);
  border-color: var(--gray-600);
}

/* ——— GHOST (Sin bordes ni fondo) ——— */
.app-btn--ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: transparent;
}

.app-btn--ghost:hover:not(:disabled) {
  background: var(--gray-100);
  color: var(--text-primary);
}

[data-theme="dark"] .app-btn--ghost:hover:not(:disabled) {
  background: var(--gray-800);
}

/* ——— DANGER ——— */
.app-btn--danger {
  background: var(--color-danger);
  color: var(--color-white);
  border-color: var(--color-danger);
}

.app-btn--danger:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
  box-shadow: var(--shadow-md);
}

/* ========================================
   ESTADOS
   ======================================== */

.app-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.app-btn--loading {
  cursor: wait;
  pointer-events: none;
}

/* Spinner */
.app-btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.6s linear infinite;
}

@keyframes btn-spin {
  to { transform: rotate(360deg); }
}

/* Icono solo (sin texto) */
.app-btn--icon-only {
  padding: 8px;
  min-width: 36px;
  min-height: 36px;
}

/* Iconos */
.app-btn__icon {
  font-size: 1.1em;
  line-height: 1;
}

.app-btn__icon--right {
  margin-left: auto;
}
</style>
