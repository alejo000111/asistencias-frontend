<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="m-0">📋 Registrar Asistencia</h3>
    </div>

    <!-- Aviso: alguna clase se cobró en $0 porque falta configurar la Tarifa Clase Suelta -->
    <div v-if="resultadoRegistro && resultadoRegistro.avisosTarifa && resultadoRegistro.avisosTarifa.length > 0"
         class="alert alert-warning d-flex align-items-start gap-2 shadow-sm mb-3">
      <span style="font-size: 1.3rem;">💲</span>
      <div>
        <strong class="d-block">Falta configurar la Tarifa Clase Suelta</strong>
        <small>
          <div v-for="(item, idx) in resultadoRegistro.avisosTarifa" :key="idx">
            <strong>{{ item.nombre }}</strong>: {{ item.motivo }}
          </div>
          <router-link v-if="esAdmin" to="/ajustes-cobros" class="fw-bold">Ir a Ajustes de Cobros →</router-link>
          <span v-else>Pídele al administrador del club que la configure en Ajustes de Cobros.</span>
        </small>
      </div>
    </div>

    <!-- Aviso: alguno de los registrados superó la cuota de su plan/complemento -->
    <div v-if="resultadoRegistro && resultadoRegistro.fueraDePlan && resultadoRegistro.fueraDePlan.length > 0"
         class="alert alert-warning d-flex align-items-start gap-2 shadow-sm mb-3">
      <span style="font-size: 1.3rem;">⚠️</span>
      <div>
        <strong class="d-block">Cuota superada</strong>
        <small>
          <div v-for="(item, idx) in resultadoRegistro.fueraDePlan" :key="idx">
            <strong>{{ item.nombre }}</strong>: {{ item.motivo || 'superó la cantidad de clases incluidas en su plan/complemento.' }}
          </div>
          La asistencia quedó registrada igual, marcada como "Fuera de plan" en el historial.
        </small>
      </div>
    </div>

    <!-- Resultado del registro de asistencias -->
    <div v-if="resultadoRegistro" class="mb-4">
      <div v-if="resultadoRegistro.fallidos.length === 0" class="alert alert-success d-flex align-items-center justify-content-between gap-2 shadow-sm flex-wrap">
        <div class="d-flex align-items-center gap-2">
          <span style="font-size: 1.5rem;">✅</span>
          <div>
            <strong class="d-block">{{ resultadoRegistro.exitosos.length }} asistencias registradas con éxito.</strong>
            <small class="text-success-emphasis">Todos los deportistas fueron registrados correctamente.</small>
          </div>
        </div>
        <button
          class="btn btn-sm btn-outline-danger fw-bold"
          @click="deshacerRegistro"
          :disabled="deshaciendo"
        >
          {{ deshaciendo ? '⏳ Deshaciendo...' : '↩️ Deshacer' }}
        </button>
      </div>

      <div v-else class="card shadow-sm border-warning">
        <div class="card-body">
          <div class="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
            <div class="d-flex align-items-center gap-2">
              <span style="font-size: 1.5rem;">⚠️</span>
              <div>
                <strong class="d-block text-warning">Registro parcial</strong>
                <small class="text-muted">
                  {{ resultadoRegistro.exitosos.length }} exitoso(s), {{ resultadoRegistro.fallidos.length }} fallido(s).
                  Los exitosos ya quedaron guardados. Corrige los errores y registra solo los pendientes.
                </small>
              </div>
            </div>
            <button
              v-if="resultadoRegistro.exitosos.length > 0"
              class="btn btn-sm btn-outline-danger fw-bold"
              @click="deshacerRegistro"
              :disabled="deshaciendo"
            >
              {{ deshaciendo ? '⏳ Deshaciendo...' : '↩️ Deshacer' }}
            </button>
          </div>

          <div v-if="resultadoRegistro.exitosos.length > 0" class="mb-2">
            <strong class="text-success small">✔ Registrados:</strong>
            <div class="d-flex flex-wrap gap-1 mt-1">
              <span v-for="nombre in resultadoRegistro.exitosos" :key="nombre"
                    class="badge bg-success-subtle text-success-emphasis px-2 py-1">
                {{ nombre }}
              </span>
            </div>
          </div>

          <div v-if="resultadoRegistro.fallidos.length > 0">
            <strong class="text-danger small">✖ Fallaron — reinténtalos:</strong>
            <div class="d-flex flex-wrap gap-1 mt-1">
              <span v-for="f in resultadoRegistro.fallidos" :key="f.nombre"
                    class="badge bg-danger-subtle text-danger-emphasis px-2 py-1"
                    :title="f.error">
                {{ f.nombre }}
              </span>
            </div>
            <button @click="resultadoRegistro = null" class="btn btn-sm btn-outline-secondary mt-2">
              Descartar y reintentar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bloqueo por sede inactiva (cuando existen sedes y todas están inactivas) -->
    <div v-if="sedesCargadas && sedesDisponibles.length > 0 && sedesActivas.length === 0" class="card shadow-sm border-warning mb-4">
      <div class="card-body text-center py-5">
        <div class="display-1 mb-4">🚫</div>
        <h4 class="text-warning fw-bold mb-3">Sede Deshabilitada</h4>
        <p class="lead text-muted mb-4" style="max-width: 500px; margin: 0 auto;">
          Esta sede fue eliminada o deshabilitada por el administrador.
          Contacte a soporte para más información y reasignación.
        </p>
      </div>
    </div>

    <div v-else class="card shadow-sm border-secondary">
      <div class="card-body p-4">
        
        <div class="row mb-4">
          <div class="col-md-6 text-center mb-3 mb-md-0">
            <label class="form-label fw-bold text-dark">🏢 Sede de la clase:</label><br>
            <select v-model="sedeSeleccionada" class="form-select shadow-sm fw-bold" style="max-width: 300px; margin: 0 auto;">
              <option value="" disabled>Selecciona una sede...</option>
              <option v-for="s in sedesDisponibles.filter(s => s.activa !== false)" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>
          <!-- Solo mostrar selector de tipo si el esquema es POR_CLASE (o no se cargó config) -->
          <div v-if="!clubConfig || clubConfig.esquemaCobro === 'POR_CLASE'" class="col-md-6 text-center">
            <label class="form-label fw-bold text-dark">Selecciona el Tipo de Clase:</label><br>
            <div class="btn-group shadow-sm" role="group">
              <input type="radio" class="btn-check" id="grupal" value="GRUPAL" v-model="tipoClase">
              <label class="btn px-4 fw-bold transition-all border" for="grupal"
                     :style="{
                       backgroundColor: tipoClase === 'GRUPAL' ? 'var(--orange-500)' : 'var(--bg-tertiary)',
                       color: tipoClase === 'GRUPAL' ? '#ffffff' : 'var(--text-primary)',
                       borderColor: tipoClase === 'GRUPAL' ? 'var(--orange-500)' : 'var(--border-primary)'
                     }">👥 Grupal</label>

              <input type="radio" class="btn-check" id="personalizada" value="PERSONALIZADA" v-model="tipoClase">
              <label class="btn px-4 fw-bold transition-all border" for="personalizada"
                     :style="{
                       backgroundColor: tipoClase === 'PERSONALIZADA' ? 'var(--orange-500)' : 'var(--bg-tertiary)',
                       color: tipoClase === 'PERSONALIZADA' ? '#ffffff' : 'var(--text-primary)',
                       borderColor: tipoClase === 'PERSONALIZADA' ? 'var(--orange-500)' : 'var(--border-primary)'
                     }">👤 Personalizada</label>
            </div>
          </div>
        </div>

        <!-- Indicador de carga para EMPLEADO (el watch dispara la petición) -->
          <div v-if="cargandoEstudiantes" class="text-center py-3">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando deportistas...</span>
            </div>
            <p class="text-muted small mt-1">Cargando deportistas...</p>
          </div>

          <div v-if="tipoClase === 'GRUPAL' && sedeSeleccionada" class="text-center mb-4">
            <label class="form-label fw-bold text-dark">Nivel del Grupo:</label><br>
            <div class="btn-group shadow-sm" role="group">
              <template v-for="(grupo, gIdx) in gruposSedeSeleccionada" :key="gIdx">
                <template v-if="grupo && grupo.nombre && grupo.nombre.trim()">
                  <input type="radio" class="btn-check" :id="'grupo-' + gIdx" :value="grupo.nombre" v-model="nivelClase">
                  <label class="btn px-4 fw-bold transition-all border" 
                         :for="'grupo-' + gIdx"
                         :style="{
                           backgroundColor: nivelClase === grupo.nombre ? (grupo.colorHex || '#6b7280') : 'var(--bg-tertiary)',
                           color: nivelClase === grupo.nombre ? '#ffffff' : 'var(--text-secondary)',
                           borderColor: grupo.colorHex || 'var(--border-primary)'
                         }">
                    {{ grupo.emoji ? grupo.emoji + ' ' : '' }}{{ grupo.nombre }}
                  </label>
                </template>
              </template>
            </div>
          </div>

          <!-- Tabla (desktop) / Cards (mobile) -->
          <div class="table-responsive mt-3 d-none d-md-block">
            <table class="table table-hover align-middle border">
              <thead class="table-light border-bottom">
                <tr>
                  <th class="text-center" style="width: 10%;">Presente</th>
                  <th>Deportista</th>
                  <!-- Precio especial solo aplica en POR_CLASE. En MENSUALIDAD el cobro es automático
                       según la cuota del plan — no se pide ni se muestra nada manual aquí. -->
                  <th v-if="!clubConfig || clubConfig.esquemaCobro === 'POR_CLASE'" style="width: 150px;">Precio Especial ($)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="estudiante in estudiantesFiltrados" :key="estudiante.id">
                  <td class="text-center">
                    <input class="form-check-input fs-4" type="checkbox" v-model="estudiante.presente">
                  </td>
                  <td class="fw-bold">{{ estudiante.nombreCompleto }}</td>
                  <td v-if="!clubConfig || clubConfig.esquemaCobro === 'POR_CLASE'">
                    <input type="text" class="form-control form-control-sm" :value="formatearMontoInput(estudiante.precioPersonalizado)" @input="actualizarPrecioInput($event, estudiante)" placeholder="Opcional" :disabled="!estudiante.presente">
                  </td>
                </tr>
                <tr v-if="estudiantesFiltrados.length === 0">
                  <td :colspan="(!clubConfig || clubConfig.esquemaCobro === 'POR_CLASE') ? 3 : 2" class="text-center text-muted py-5">
                    No hay deportistas registrados en este nivel.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Vista mobile: cards de deportistas -->
          <div class="d-md-none mt-3">
            <div v-for="estudiante in estudiantesFiltrados" :key="estudiante.id"
                 class="home-estudiante-card"
                 :class="{ 'home-estudiante-card--selected': estudiante.presente }"
                 @click="estudiante.presente = !estudiante.presente">
              <div class="d-flex align-items-center gap-3 flex-grow-1 min-w-0">
                <div class="home-estudiante-card__checkbox">
                  <input class="form-check-input fs-5 m-0" type="checkbox" v-model="estudiante.presente" @click.stop>
                </div>
                <span class="home-estudiante-card__name text-truncate">{{ estudiante.nombreCompleto }}</span>
              </div>
              <!-- Precio especial solo aplica en POR_CLASE. En MENSUALIDAD el cobro es automático
                   según la cuota del plan — no se pide ni se muestra nada manual aquí. -->
              <div v-if="!clubConfig || clubConfig.esquemaCobro === 'POR_CLASE'" class="ms-3" style="width: 90px; flex-shrink: 0;" @click.stop>
                <input type="text" class="form-control form-control-sm text-center"
                       :value="formatearMontoInput(estudiante.precioPersonalizado)"
                       @input="actualizarPrecioInput($event, estudiante)"
                       placeholder="Precio"
                       :disabled="!estudiante.presente">
              </div>
            </div>
            <div v-if="estudiantesFiltrados.length === 0" class="text-center text-muted py-5">
              No hay deportistas registrados en este nivel.
            </div>
          </div>

      </div>
    </div>

    <!-- Clases de Cortesía: minimizada por defecto (no todas las clases registran cortesías) —
         se despliega con el botón. Comparten la fecha y el botón "Registrar Asistencias" de abajo
         con el resto de deportistas de la misma sesión. -->
    <div v-if="sedeSeleccionada" class="card shadow-sm border-secondary mt-4">
      <button
        type="button"
        class="cortesia-toggle"
        @click="cortesiaExpandida = !cortesiaExpandida"
        :aria-expanded="cortesiaExpandida"
      >
        <span class="cortesia-section__badge">🎟 Clase(s) de Cortesía</span>
        <span v-if="!cortesiaExpandida && cortesiasConDatos > 0" class="badge bg-secondary ms-2">{{ cortesiasConDatos }}</span>
        <span class="cortesia-toggle__arrow">{{ cortesiaExpandida ? '▲' : '▼' }}</span>
      </button>

      <div v-if="cortesiaExpandida" class="card-body p-4 pt-0">
        <template v-for="(cortesia, idx) in cortesias" :key="idx">
          <hr v-if="idx > 0" class="my-3">
          <CortesiaForm
            v-model="cortesias[idx]"
            :idx="idx"
            :grupos-disponibles="gruposSedeSeleccionada"
            :show-remove="cortesias.length > 1"
            @remove="quitarCortesia(idx)"
          />
        </template>

        <button type="button" class="btn btn-sm fw-bold mt-3 cortesia-add-btn" @click="agregarCortesia">
          ➕ Agregar Otra Cortesía (familia distinta)
        </button>
      </div>
    </div>

    <!-- Fecha y botón compartidos: registran de una vez la asistencia regular Y las cortesías -->
    <div v-if="sedeSeleccionada" class="home-footer-actions">
      <div class="home-footer-fecha">
        <label class="home-footer-label">📅 Fecha (Opcional):</label>
        <input type="date" v-model="fechaAsistencia" class="form-control">
        <small class="home-footer-hint">Si lo dejas vacío, se usará la fecha de hoy.</small>
      </div>
      <AppButton variant="success" size="lg" class="home-footer-btn" @click="registrarAsistencias" :disabled="registrando">
        {{ registrando ? '⏳ Registrando...' : '✅ Registrar Asistencias' }}
      </AppButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import axios from 'axios';
import { formatearMontoInput, actualizarMontoInput } from '@/utils/formatters';
import { isAdmin } from '@/utils/auth';
import AppButton from '@/components/ui/AppButton.vue';
import CortesiaForm from '@/components/CortesiaForm.vue';

import { useSedes } from '@/utils/useSedes';

const { sedes: sedesDisponibles, sedesCargadas, sedesActivas, cargarSedes } = useSedes();

const esAdmin = isAdmin();

const students = ref([]);

const cargandoEstudiantes = ref(false);
const sedeSeleccionada = ref('');
const tipoClase = ref('GRUPAL');
const nivelClase = ref('');
const fechaAsistencia = ref('');

// Clases de cortesía a registrar junto con la asistencia regular (misma fecha/sede).
// Cada bloque = una familia (un acudiente) con uno o más deportistas (hermanos).
const nuevaCortesia = () => ({
  nombreAcudiente: '',
  telefonoAcudiente: '',
  deportistas: [{ nombreDeportista: '', nivel: nivelClase.value || '' }]
});
const cortesias = ref([nuevaCortesia()]);
const cortesiaExpandida = ref(false);
const cortesiasConDatos = computed(() => cortesias.value.filter(c =>
  (c.nombreAcudiente && c.nombreAcudiente.trim()) ||
  (c.deportistas || []).some(d => d.nombreDeportista && d.nombreDeportista.trim())
).length);
const agregarCortesia = () => { cortesias.value.push(nuevaCortesia()); cortesiaExpandida.value = true; };
const quitarCortesia = (idx) => {
  cortesias.value.splice(idx, 1);
  if (cortesias.value.length === 0) cortesias.value.push(nuevaCortesia());
};

// Configuración del club — determina qué campos mostrar en el registro
const clubConfig = ref(null);

const cargarClubConfig = async () => {
  try {
    const res = await axios.get('/api/config/cobro');
    clubConfig.value = res.data;
    // Si el esquema NO es POR_CLASE, forzar tipo GRUPAL (no aplica personalizada)
    if (res.data?.esquemaCobro !== 'POR_CLASE') {
      tipoClase.value = 'GRUPAL';
    }
  } catch (e) {
    // Si falla la carga de config (p.ej. empleado sin permisos), asumimos POR_CLASE
    // para no ocultar funcionalidades por error
    clubConfig.value = null;
  }
};

const gruposSedeSeleccionada = computed(() => {
  const sede = sedesDisponibles.value.find(s => s.id === sedeSeleccionada.value);
  return sede?.grupos || [];
});

// ============================================================
// WATCH UI: al cambiar sede, auto-seleccionar tipo GRUPAL
// y el primer grupo disponible
// ============================================================
watch(sedeSeleccionada, (nuevoId) => {
  tipoClase.value = 'GRUPAL';
  if (nuevoId) {
    const sede = sedesDisponibles.value.find(s => s.id === nuevoId);
    if (sede && sede.grupos && sede.grupos.length > 0) {
      const primerGrupoValido = sede.grupos.find(g => g && g.nombre && g.nombre.trim() !== '');
      nivelClase.value = primerGrupoValido ? primerGrupoValido.nombre : '';
    } else {
      nivelClase.value = '';
    }
  } else {
    nivelClase.value = '';
  }
});

// ============================================================
// WATCH REACTIVO UNIFICADO (Enfoque 1): Dispara petición HTTP
// cada vez que el usuario cambia sede, nivel o tipo de clase.
// Funciona para ADMIN y EMPLEADO por igual.
// GET /api/clientes/estudiantes?sedeId=X&nivel=Y
// El backend aplica el filtro a nivel BD (JOIN FETCH + WHERE)
// y para EMPLEADO añade restricción por sedes autorizadas.
// ============================================================
watch([sedeSeleccionada, nivelClase, tipoClase], async ([sedeId, nivel, tipo]) => {
  if (!sedeId) {
    students.value = [];
    return;
  }

  cargandoEstudiantes.value = true;
  try {
    const params = { sedeId };
    if (tipo === 'GRUPAL' && nivel) {
      // Reconstruir el nivel completo (emoji + nombre) como está en la BD
      // porque 'nivelClase' solo guarda grupo.nombre (ej. "Iniciación")
      // pero la columna 'enrollments.nivel' almacena "🌱 Iniciación".
      const grupo = gruposSedeSeleccionada.value.find(g => g.nombre === nivel);
      const nivelConEmoji = grupo
        ? `${grupo.emoji || ''} ${grupo.nombre}`.trim()
        : nivel;
      params.nivel = nivelConEmoji;
    }
    const response = await axios.get('/api/clientes/estudiantes', { params });
    if (!response?.data) { students.value = []; return; }

    students.value = response.data
      .filter(hijo => hijo.estado === 'ACTIVO')
      .map(hijo => ({
        ...hijo,
        presente: false,
        precioPersonalizado: null
      }))
      .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
  } catch (error) {
    console.error('Error cargando estudiantes:', error);
    students.value = [];
  } finally {
    cargandoEstudiantes.value = false;
  }
});

// ============================================================
// COMPUTED: identidad simple — el backend ya filtró por sede y nivel.
// Tanto ADMIN como EMPLEADO reciben datos ya filtrados desde la BD.
// ============================================================
const estudiantesFiltrados = computed(() => students.value);

const actualizarPrecioInput = (event, estudiante) => {
  actualizarMontoInput(event, estudiante, 'precioPersonalizado');
};

const cargarSedesYPreseleccionar = async () => {
  await cargarSedes();
  const activas = sedesDisponibles.value.filter(s => s.activa !== false);
  if (activas.length > 0) {
    const sedePrincipal = activas.find(s => s.nombre === 'Sede Principal');
    sedeSeleccionada.value = sedePrincipal ? sedePrincipal.id : activas[0].id;
  }
};

const registrando = ref(false);
const resultadoRegistro = ref(null); // { exitosos: string[], fallidos: { nombre: string, error: string }[] }
const idsRegistrados = ref([]); // ids de Attendance creadas con éxito en el último registro (para Deshacer)
const deshaciendo = ref(false);

// Familias con datos completos: acudiente + al menos un deportista con nombre
const cortesiasValidas = () => cortesias.value
  .map(c => ({ ...c, deportistas: c.deportistas.filter(d => d.nombreDeportista.trim()) }))
  .filter(c => c.nombreAcudiente.trim() && c.telefonoAcudiente.trim() && c.deportistas.length > 0);

const registrarAsistencias = async () => {
  const presentes = estudiantesFiltrados.value.filter(s => s.presente);
  const familiasAEnviar = cortesiasValidas();

  if (presentes.length === 0 && familiasAEnviar.length === 0) {
    alert("⚠️ Selecciona al menos un estudiante o completa los datos de una cortesía.");
    return;
  }

  if (!sedeSeleccionada.value) {
    alert("⚠️ Selecciona la sede de la clase.");
    return;
  }

  const nivelAEnviar = tipoClase.value === 'GRUPAL' ? nivelClase.value : null;
  registrando.value = true;
  resultadoRegistro.value = null;

  const asistenciaResults = await Promise.allSettled(presentes.map(est => {
    const params = {
      studentId: est.id,
      tipoClase: tipoClase.value,
      nivel: nivelAEnviar,
      fecha: fechaAsistencia.value,
      sedeId: sedeSeleccionada.value
    };
    let precioLimpio = null;
    if (est.precioPersonalizado != null && est.precioPersonalizado !== '') {
      const num = Number(est.precioPersonalizado);
      if (!isNaN(num) && num >= 0) {
        precioLimpio = num;
      }
    }
    if (precioLimpio !== null) {
      params.precioPersonalizado = precioLimpio;
    }
    if (est.esClaseSuelta) {
      params.esClaseSuelta = true;
    }
    return axios.post('/api/finanzas/asistencia', null, { params });
  }));

  // Las cortesías se envían UNA por UNA (dentro de cada familia y entre familias),
  // nunca en paralelo: así, si dos hermanos comparten acudiente, el segundo siempre
  // encuentra al acudiente que acaba de crear el primero, en vez de arriesgarse a
  // crear dos acudientes duplicados por una condición de carrera.
  const cortesiaExitosos = [];
  const cortesiaFallidos = [];
  const idsCreadosCortesia = [];
  const familiasConFallos = [];

  for (const familia of familiasAEnviar) {
    const deportistasFallidos = [];
    for (const d of familia.deportistas) {
      const nombreEtiqueta = '🎟 ' + d.nombreDeportista.trim();
      try {
        const res = await axios.post('/api/finanzas/cortesia', {
          nombreDeportista: d.nombreDeportista.trim(),
          nombreAcudiente: familia.nombreAcudiente.trim(),
          telefonoAcudiente: familia.telefonoAcudiente.trim(),
          sedeId: sedeSeleccionada.value,
          nivel: d.nivel || nivelAEnviar || null,
          fecha: fechaAsistencia.value || null
        });
        cortesiaExitosos.push(nombreEtiqueta);
        if (res.data?.id) idsCreadosCortesia.push(res.data.id);
      } catch (e) {
        cortesiaFallidos.push({ nombre: nombreEtiqueta, error: e.response?.data || e.message || 'Error de conexión' });
        deportistasFallidos.push(d);
      }
    }
    if (deportistasFallidos.length > 0) {
      familiasConFallos.push({ ...familia, deportistas: deportistasFallidos });
    }
  }

  registrando.value = false;

  const exitosos = [];
  const fallidos = [];
  const idsCreados = [];
  const fueraDePlan = [];
  const avisosTarifa = [];

  asistenciaResults.forEach((r, i) => {
    const nombre = presentes[i].nombreCompleto;
    if (r.status === 'fulfilled') {
      exitosos.push(nombre);
      if (r.value?.data?.id) idsCreados.push(r.value.data.id);
      if (r.value?.data?.fueraDePlan) fueraDePlan.push({ nombre, motivo: r.value.data.motivoFueraDePlan || null });
      if (r.value?.data?.avisoTarifaNoConfigurada) avisosTarifa.push({ nombre, motivo: r.value.data.avisoTarifaNoConfigurada });
    } else {
      fallidos.push({ nombre, error: r.reason?.response?.data || r.reason?.message || 'Error de conexión' });
    }
  });

  exitosos.push(...cortesiaExitosos);
  fallidos.push(...cortesiaFallidos);
  idsCreados.push(...idsCreadosCortesia);

  resultadoRegistro.value = { exitosos, fallidos, fueraDePlan, avisosTarifa };
  idsRegistrados.value = idsCreados;

  if (fallidos.length === 0) {
    students.value.forEach(s => { s.presente = false; s.precioPersonalizado = null; });
    fechaAsistencia.value = '';
    cortesias.value = [nuevaCortesia()];
  } else {
    // Conservar solo las familias/deportistas que fallaron, para no perder lo que ya se registró bien
    cortesias.value = familiasConFallos.length > 0 ? familiasConFallos : [nuevaCortesia()];
  }
};

const deshacerRegistro = async () => {
  if (idsRegistrados.value.length === 0) return;
  if (!confirm(`¿Deshacer ${idsRegistrados.value.length} asistencia(s) recién registrada(s)?`)) return;

  deshaciendo.value = true;
  try {
    await Promise.allSettled(idsRegistrados.value.map(id => axios.delete(`/api/finanzas/asistencia/${id}`)));
  } finally {
    deshaciendo.value = false;
    resultadoRegistro.value = null;
    idsRegistrados.value = [];
  }
};

onMounted(() => {
  cargarSedesYPreseleccionar();
  cargarClubConfig();
});
</script>

<style scoped>
.cortesia-toggle {
  display: flex;
  align-items: center;
  width: 100%;
  background: none;
  border: none;
  padding: var(--space-4, 16px);
  cursor: pointer;
  text-align: left;
}

.cortesia-toggle__arrow {
  margin-left: auto;
  color: var(--text-secondary, #6b7280);
  font-size: 0.75rem;
}

.cortesia-section__header {
  margin-bottom: var(--space-4, 16px);
}

.cortesia-section__badge {
  display: inline-block;
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
  border-radius: 20px;
  padding: 2px 12px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  margin-bottom: var(--space-2, 8px);
}

.cortesia-add-btn {
  background: transparent;
  border: 2px solid #7c3aed;
  color: #7c3aed;
}

.cortesia-add-btn:hover,
.cortesia-add-btn:focus {
  background: #7c3aed;
  border-color: #7c3aed;
  color: #fff;
}

/* Mobile: tarjetas de estudiantes en lugar de tabla */
.home-estudiante-card {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  margin-bottom: var(--space-2);
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.home-estudiante-card--selected {
  border-color: var(--orange-300);
  background: var(--orange-50);
}

.home-estudiante-card__left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
}

.home-estudiante-card__checkbox {
  flex-shrink: 0;
}

.home-estudiante-card__info {
  flex: 1;
}

.home-estudiante-card__name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--text-primary);
}

/* Footer actions responsive */
.home-footer-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-primary);
}

.home-footer-fecha {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.home-footer-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.home-footer-hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.home-footer-btn {
  width: 100%;
}

@media (min-width: 768px) {
  .home-footer-actions {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }

  .home-footer-fecha {
    width: 50%;
  }

  .home-footer-btn {
    width: auto;
  }
}
</style>