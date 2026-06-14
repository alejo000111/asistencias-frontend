/**
 * Formatea una fecha a string legible (es-ES, día, mes, año)
 * Soporta arrays de fecha de Java [yyyy, MM, dd] y strings ISO
 */
export function formatearFecha(f, defaultReturn = '') {
  if (!f) return defaultReturn;
  if (Array.isArray(f)) {
    return new Date(Date.UTC(f[0], f[1] - 1, f[2]))
      .toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  return new Date(f)
    .toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Formatea un número a moneda colombiana (sin signo $)
 * Ej: 50000 → "50.000"
 */
export function formatearDinero(m) {
  if (m === null || m === undefined) return '0';
  return Number(m).toLocaleString('es-CO');
}

/**
 * Formatea un valor numérico para input de dinero
 * Ej: 50000 → "50.000", null o vacío → ""
 */
export function formatearMontoInput(v) {
  if (v === null || v === undefined || v === '') return '';
  const soloDigitos = String(v).replace(/\D/g, '');
  if (!soloDigitos) return '';
  return Number(soloDigitos).toLocaleString('es-CO');
}

/**
 * Procesa el evento @input de un campo dinero y asigna el valor numérico limpio
 * @param {Event} event - evento del input
 * @param {Object} obj - objeto reactivo donde asignar
 * @param {string} prop - nombre de la propiedad a asignar (default: 'nuevoAbono')
 * @param {*} emptyValue - valor cuando está vacío (default: null)
 */
export function actualizarMontoInput(event, obj, prop = 'nuevoAbono', emptyValue = null) {
  const raw = (event.target.value || '').replace(/\D/g, '');
  obj[prop] = raw ? Number(raw) : emptyValue;
}
