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
 * Convierte una fecha del backend (array [yyyy,MM,dd] o string ISO) al formato YYYY-MM-DD
 * para usarlo en <input type="date">.
 * Si la fecha es inválida, retorna ''.
 */
export function formatearAInputDate(f) {
  if (!f) return '';
  if (Array.isArray(f)) {
    const [y, m, d] = f;
    if (y == null || m == null || d == null) return '';
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  // Si ya es string (ISO o YYYY-MM-DD), extraer solo la parte de fecha
  if (typeof f === 'string') {
    // Si tiene formato ISO completo "2024-03-15T00:00:00"
    const match = f.match(/^(\d{4})-\d{2}-\d{2}/);
    if (match) return match[0];
    // Último recurso: intentar parsear con Date (cubre formatos como "2024/03/15")
    const d = new Date(f);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return '';
  }
  return '';
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
