<template>
  <div class="superadmin-view">
    <!-- ====== HEADER DINÁMICO ADAPTATIVO ====== -->
    <div class="superadmin-header">
      <div class="superadmin-header__left">
        <span class="superadmin-header__badge">⚡ SUPERADMIN</span>
        
        <!-- Header Versión Clubs -->
        <template v-if="subTab === 'clubes'">
          <h1 class="superadmin-header__title">🏢 Gestión de Clubs Registrados</h1>
          <p class="superadmin-header__subtitle">
            Administra escuelas deportivas, licenciamiento, suspensiones por mora y fechas de corte.
          </p>
        </template>

        <!-- Header Versión Planes -->
        <template v-else-if="subTab === 'planes'">
          <h1 class="superadmin-header__title">💎 Catálogo de Planes y Membresías</h1>
          <p class="superadmin-header__subtitle">
            Configura los límites de deportistas por nivel y tarifas mensuales en COP.
          </p>
        </template>

        <!-- Header Versión Usuarios -->
        <template v-else-if="subTab === 'usuarios'">
          <h1 class="superadmin-header__title">👥 Administración de Usuarios Globales</h1>
          <p class="superadmin-header__subtitle">
            Visualiza y gestiona las cuentas con roles Admin y Empleado asignadas a sus respectivos clubes.
          </p>
        </template>
      </div>

      <!-- Acciones adaptativas por pestaña -->
      <div class="superadmin-header__actions">
        <button v-if="subTab === 'clubes'" class="btn-premium btn-premium--primary" @click="abrirModalNuevoClub">
          ➕ Nuevo Club
        </button>
        <button v-else-if="subTab === 'planes'" class="btn-premium btn-premium--primary" @click="abrirModalNuevoPlan">
          💎 Agregar Plan
        </button>
        <button v-else-if="subTab === 'usuarios'" class="btn-premium btn-premium--primary" @click="abrirModalNuevoUsuario">
          👤 Crear Usuario
        </button>
      </div>
    </div>

    <!-- ====== METRICAS DINÁMICAS POR PESTAÑA ====== -->
    <div class="superadmin-stats">
      <!-- Métricas Pestaña Clubs -->
      <template v-if="subTab === 'clubes'">
        <div class="stat-card">
          <span class="stat-card__icon">🏢</span>
          <div class="stat-card__body">
            <span class="stat-card__value">{{ clubes.length }}</span>
            <span class="stat-card__label">Clubs Registrados</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-card__icon">✅</span>
          <div class="stat-card__body">
            <span class="stat-card__value">{{ clubesActivos }}</span>
            <span class="stat-card__label">Clubs Activos</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-card__icon">⚠️</span>
          <div class="stat-card__body">
            <span class="stat-card__value">{{ clubesSuspendidos }}</span>
            <span class="stat-card__label">Suspendidos por Mora</span>
          </div>
        </div>
      </template>

      <!-- Métricas Pestaña Planes -->
      <template v-else-if="subTab === 'planes'">
        <div class="stat-card">
          <span class="stat-card__icon">💎</span>
          <div class="stat-card__body">
            <span class="stat-card__value">{{ planes.length }}</span>
            <span class="stat-card__label">Planes Activos</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-card__icon">👥</span>
          <div class="stat-card__body">
            <span class="stat-card__value">1 a Ilimitado</span>
            <span class="stat-card__label">Rango de Capacidad</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-card__icon">🏷️</span>
          <div class="stat-card__body">
            <span class="stat-card__value">{{ planes.length > 0 ? formatCOP(planes[0].precioCopMensual) : '$ 0' }}</span>
            <span class="stat-card__label">Tarifa Inicial Base</span>
          </div>
        </div>
      </template>

      <!-- Métricas Pestaña Usuarios -->
      <template v-else-if="subTab === 'usuarios'">
        <div class="stat-card">
          <span class="stat-card__icon">🛡️</span>
          <div class="stat-card__body">
            <span class="stat-card__value">{{ usuarios.filter(u => u.role === 'ADMIN').length }}</span>
            <span class="stat-card__label">Admins de Club</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-card__icon">🧑‍💼</span>
          <div class="stat-card__body">
            <span class="stat-card__value">{{ usuarios.filter(u => u.role === 'EMPLEADO').length }}</span>
            <span class="stat-card__label">Entrenadores / Empleados</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-card__icon">👥</span>
          <div class="stat-card__body">
            <span class="stat-card__value">{{ usuarios.length }}</span>
            <span class="stat-card__label">Total Usuarios Registrados</span>
          </div>
        </div>
      </template>
    </div>

    <!-- ====== TAB 1: CLUBS REGISTRADOS ====== -->
    <section v-if="subTab === 'clubes'" class="superadmin-section">
      <div class="superadmin-section__header">
        <h2 class="superadmin-section__title">🏢 Clubs Registrados</h2>
        <div class="sa-filters-row" style="margin-bottom: 0;">
          <input
            id="sa-buscar-club"
            v-model="busqueda"
            type="text"
            class="sa-search"
            placeholder="Buscar club o administrador..."
          />
          <select v-model="filtroClubId" class="sa-select">
            <option :value="null">🏢 Todos los clubs</option>
            <option v-for="c in clubes" :key="c.id" :value="c.id">{{ c.clubNombre || c.username }}</option>
          </select>
        </div>
      </div>

      <div v-if="cargando" class="sa-loading">
        <div class="spinner-premium"></div>
        <span>Cargando clubs...</span>
      </div>

      <div v-else-if="clubesFiltrados.length === 0" class="sa-empty">
        <span>🔍</span>
        <p>No se encontraron clubs registrados.</p>
      </div>

      <div v-else class="sa-table-container">
        <table class="sa-table sa-table--compact">
          <thead>
            <tr>
              <th>Nombre del Club</th>
              <th>Nombre Admin</th>
              <th>Estado</th>
              <th>Plan</th>
              <th>Fecha de Corte</th>
              <th style="text-align: right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="club in clubesFiltrados" :key="club.id" :class="{ 'sa-table__row--suspended': club.clubEstado === 'SUSPENDIDO_POR_MORA' }">
              <td class="sa-table__nombre">
                {{ club.clubNombre || '—' }}
              </td>
              <td>
                <div class="sa-user-info">
                  <span class="sa-user-info__name">{{ club.nombreAdministrador || club.username }}</span>
                  <small class="sa-user-info__login">(@{{ club.username }})</small>
                </div>
              </td>
              <td>
                <span
                  class="sa-badge"
                  :class="club.clubEstado === 'SUSPENDIDO_POR_MORA' ? 'sa-badge--danger' : 'sa-badge--success'"
                >
                  {{ club.clubEstado === 'SUSPENDIDO_POR_MORA' ? '🚫 Suspendido' : '✅ Activo' }}
                </span>
              </td>
              <td>
                <span class="sa-badge sa-badge--plan">
                  {{ formatPlanNombre(club.planActual) }}
                </span>
              </td>
              <td>
                <span v-if="club.exentoTarifa" class="sa-badge sa-badge--plan" title="Club exento de tarifa SaaS">🎗️ Exento</span>
                <template v-else>{{ formatFecha(club.fechaCorte) }}</template>
              </td>
              <td style="text-align: right;">
                <div class="sa-table__dropdown-menu-wrapper">
                  <button class="sa-popover-btn" @click="toggleMenuClub(club.id)" title="Opciones del club">
                    ⋮
                  </button>
                  <div v-if="activeMenuClubId === club.id" class="sa-action-dropdown" @click.stop>
                    <button class="sa-action-dropdown__item" @click="verMetricasClub(club)">
                      ℹ️ Más información
                    </button>
                    <button class="sa-action-dropdown__item" @click="editarClub(club)">
                      ✏️ Editar Club / Plan
                    </button>
                    <button
                      v-if="club.clubEstado !== 'SUSPENDIDO_POR_MORA'"
                      class="sa-action-dropdown__item sa-action-dropdown__item--danger"
                      @click="suspenderClub(club)"
                    >
                      🚫 Suspender por Mora
                    </button>
                    <button
                      v-else
                      class="sa-action-dropdown__item sa-action-dropdown__item--success"
                      @click="activarClub(club)"
                    >
                      ✅ Reactivar Club
                    </button>
                    <button
                      v-if="club.clubEstado === 'SUSPENDIDO_POR_MORA'"
                      class="sa-action-dropdown__item sa-action-dropdown__item--danger"
                      @click="eliminarClub(club)"
                    >
                      🗑️ Eliminar Definitivamente
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ====== TAB 2: PLANES SAAS ====== -->
    <section v-if="subTab === 'planes'" class="superadmin-section">
      <div class="sa-planes-modern-grid">
        <div
          v-for="plan in planes"
          :key="plan.id"
          class="sa-plan-card-modern"
        >
          <div class="sa-plan-card-modern__header">
            <h3 class="sa-plan-card-modern__title">{{ plan.nombre }}</h3>
          </div>

          <div v-if="planEditandoId !== plan.id" class="sa-plan-card-modern__body">
            <div class="sa-plan-card-modern__price">
              {{ formatCOP(plan.precioCopMensual) }}
              <span class="sa-plan-card-modern__period">/mes</span>
            </div>
            <div class="sa-plan-card-modern__meta">
              👥 Capacidad: <strong>{{ plan.limiteInferior }} a {{ plan.limiteSuperior ?? 'Ilimitado' }} deportistas</strong>
            </div>
            <div class="sa-plan-card-modern__actions">
              <button class="btn-sm btn-sm--secondary" @click="iniciarEditarPlan(plan)">
                ✏️ Editar
              </button>
              <button class="btn-sm btn-sm--danger" @click="eliminarPlan(plan)">
                🗑️ Eliminar
              </button>
            </div>
          </div>

          <!-- FORMULARIO EDICIÓN PLAN -->
          <div v-else class="sa-plan-card-modern__edit-form">
            <label class="sa-label-sm">Nombre del Plan</label>
            <input v-model="formPlanEdit.nombre" type="text" class="sa-input sa-input--sm" />

            <div class="sa-row-2">
              <div>
                <label class="sa-label-sm">Mín. Deportistas</label>
                <input v-model.number="formPlanEdit.limiteInferior" type="number" class="sa-input sa-input--sm" />
              </div>
              <div>
                <label class="sa-label-sm">Máx. (vacío = Ilimitado)</label>
                <input v-model.number="formPlanEdit.limiteSuperior" type="number" class="sa-input sa-input--sm" placeholder="Ilimitado" />
              </div>
            </div>

            <label class="sa-label-sm">Precio Mensual COP</label>
            <input v-model.number="formPlanEdit.precioCopMensual" type="number" class="sa-input sa-input--sm" />

            <div class="sa-plan-card-modern__edit-actions">
              <button class="btn-sm btn-sm--primary" @click="guardarEdicionPlan(plan.id)">💾 Guardar</button>
              <button class="btn-sm btn-sm--secondary" @click="planEditandoId = null">✕ Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ====== TAB 3: GESTIÓN DE USUARIOS (ADMINS Y EMPLEADOS) ====== -->
    <section v-if="subTab === 'usuarios'" class="superadmin-section">
      <!-- Buscador y Filtro por Rol -->
      <div class="sa-filters-row">
        <input
          v-model="busquedaUsuario"
          type="text"
          class="sa-search"
          placeholder="🔍 Buscar por nombre, usuario o club..."
        />
        <select v-model="filtroRol" class="sa-select">
          <option value="">🎭 Todos los Roles</option>
          <option value="ADMIN">🛡️ ADMIN (Club)</option>
          <option value="EMPLEADO">🧑‍💼 EMPLEADO (Entrenador)</option>
        </select>
      </div>

      <div class="sa-table-container">
        <table class="sa-table sa-table--compact">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Usuario (Login)</th>
              <th>Rol</th>
              <th>Club Asignado</th>
              <th style="text-align: right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in usuariosFiltrados" :key="user.id">
              <td class="fw-bold">{{ user.nombreCompleto || user.username }}</td>
              <td>
                <code class="sa-badge sa-badge--user">@{{ user.username }}</code>
              </td>
              <td>
                <span class="sa-badge" :class="user.role === 'ADMIN' ? 'sa-badge--plan' : 'sa-badge--user'">
                  {{ user.role === 'ADMIN' ? '🛡️ Admin Club' : '🧑‍💼 Entrenador' }}
                </span>
              </td>
              <td>
                {{ user.clubNombre || '—' }}
                <span v-if="!clubExiste(user.clubId)" class="sa-badge sa-badge--danger" title="El club de este usuario ya no existe o fue renombrado">
                  ⚠️ Sin club real
                </span>
              </td>
              <td style="text-align: right;">
                <button class="sa-popover-btn" @click="editarUsuario(user)" title="Editar usuario">
                  ✏️
                </button>
                <button class="sa-popover-btn" @click="eliminarUsuario(user)" title="Eliminar usuario">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ====== MODAL: NUEVO CLUB ====== -->
    <div v-if="modalNuevoClub" class="sa-modal-overlay" @click.self="cerrarModalNuevoClub">
      <div class="sa-modal">
        <div class="sa-modal__header">
          <h3>➕ Crear Nuevo Club</h3>
          <button class="sa-modal__close" @click="cerrarModalNuevoClub">✕</button>
        </div>
        <div class="sa-modal__body">
          <div v-if="errorModal" class="sa-alert sa-alert--danger">{{ errorModal }}</div>

          <label>Nombre del Club *</label>
          <input v-model="nuevoClub.clubNombre" type="text" class="sa-input" placeholder="ej: Academia Tigres" />

          <label>Nombre del Administrador *</label>
          <input v-model="nuevoClub.nombreAdministrador" type="text" class="sa-input" placeholder="ej: Alejandro Gómez" />

          <label>Usuario (Login / Nickname) *</label>
          <input v-model="nuevoClub.username" type="text" class="sa-input" placeholder="ej: admin_tigres" />

          <label>Contraseña Temporal *</label>
          <input v-model="nuevoClub.password" type="password" class="sa-input" placeholder="Mínimo 6 caracteres" />

          <label>Plan Inicial</label>
          <select v-model="nuevoClub.planActual" class="sa-select">
            <option v-for="p in planes" :key="p.id" :value="mapPlanEnum(p)">
              {{ p.nombre }} — {{ formatCOP(p.precioCopMensual) }}
            </option>
          </select>

          <div class="sa-checkbox-row">
            <input id="sa-nuevo-exento" v-model="nuevoClub.exentoTarifa" type="checkbox" />
            <label for="sa-nuevo-exento" class="sa-checkbox-label">🎗️ Club exento de tarifa (sin fecha de corte, no se suspende por mora)</label>
          </div>

          <template v-if="!nuevoClub.exentoTarifa">
            <label>Fecha de Corte</label>
            <input v-model="nuevoClub.fechaCorte" type="date" class="sa-input" />
          </template>
        </div>
        <div class="sa-modal__footer">
          <button class="btn-sm btn-sm--secondary" @click="cerrarModalNuevoClub">Cancelar</button>
          <button class="btn-sm btn-sm--primary" :disabled="creandoClub" @click="crearClub">
            {{ creandoClub ? 'Creando...' : '✅ Crear Club' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ====== MODAL: EDITAR CLUB (SINCRONIZADO CON PLANES DINÁMICOS) ====== -->
    <div v-if="modalEditarClub" class="sa-modal-overlay" @click.self="cerrarModalEditar">
      <div class="sa-modal">
        <div class="sa-modal__header">
          <h3>✏️ Editar Club — {{ clubEditando?.clubNombre || clubEditando?.username }}</h3>
          <button class="sa-modal__close" @click="cerrarModalEditar">✕</button>
        </div>
        <div class="sa-modal__body">
          <div v-if="errorModal" class="sa-alert sa-alert--danger">{{ errorModal }}</div>

          <label>Nombre del Club</label>
          <input v-model="formEditar.clubNombre" type="text" class="sa-input" />

          <label>Nombre del Administrador</label>
          <input v-model="formEditar.nombreAdministrador" type="text" class="sa-input" />

          <label>Usuario (Login) del Admin</label>
          <input v-model="formEditar.username" type="text" class="sa-input" placeholder="ej: admin_tigres" />

          <label>Nueva Contraseña del Admin (dejar en blanco para conservar)</label>
          <input v-model="formEditar.password" type="password" class="sa-input" placeholder="Mínimo 6 caracteres" />

          <label>Plan Asignado</label>
          <select v-model="formEditar.planActual" class="sa-select">
            <option v-for="p in planes" :key="p.id" :value="mapPlanEnum(p)">
              {{ p.nombre }} — {{ formatCOP(p.precioCopMensual) }}
            </option>
          </select>

          <div class="sa-checkbox-row">
            <input id="sa-editar-exento" v-model="formEditar.exentoTarifa" type="checkbox" />
            <label for="sa-editar-exento" class="sa-checkbox-label">🎗️ Club exento de tarifa (sin fecha de corte, no se suspende por mora)</label>
          </div>

          <template v-if="!formEditar.exentoTarifa">
            <label>Fecha de Corte</label>
            <input v-model="formEditar.fechaCorte" type="date" class="sa-input" />
          </template>
        </div>
        <div class="sa-modal__footer">
          <button class="btn-sm btn-sm--secondary" @click="cerrarModalEditar">Cancelar</button>
          <button class="btn-sm btn-sm--primary" :disabled="guardandoEdicion" @click="guardarEdicion">
            {{ guardandoEdicion ? 'Guardando...' : '💾 Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ====== MODAL: MÁS INFORMACIÓN (MÉTRICAS DEL CLUB) ====== -->
    <div v-if="modalMetricas" class="sa-modal-overlay" @click.self="modalMetricas = false">
      <div class="sa-modal">
        <div class="sa-modal__header">
          <h3>ℹ️ Métricas del Club — {{ metricasClub?.clubNombre }}</h3>
          <button class="sa-modal__close" @click="modalMetricas = false">✕</button>
        </div>
        <div class="sa-modal__body">
          <div v-if="cargandoMetricas" class="sa-loading">
            <div class="spinner-premium"></div>
            <span>Consultando métricas de infraestructura...</span>
          </div>
          <div v-else-if="metricasClub" class="metricas-grid">
            <div class="metrica-card">
              <span class="metrica-icon">👤</span>
              <div class="metrica-val">{{ metricasClub.cantAdmins }}</div>
              <span class="metrica-lbl">Administradores</span>
            </div>
            <div class="metrica-card">
              <span class="metrica-icon">📋</span>
              <div class="metrica-val">{{ metricasClub.cantEntrenadores }}</div>
              <span class="metrica-lbl">Entrenadores Activos</span>
            </div>
            <div class="metrica-card">
              <span class="metrica-icon">🛼</span>
              <div class="metrica-val">{{ metricasClub.cantDeportistasActivos }}</div>
              <span class="metrica-lbl">Deportistas Activos</span>
            </div>
            <div class="metrica-card">
              <span class="metrica-icon">💾</span>
              <div class="metrica-val">{{ metricasClub.espacioMb }} MB</div>
              <span class="metrica-lbl">Espacio en Base de Datos</span>
            </div>
          </div>
          <p class="sa-privacy-note">
            🛡️ <em>Privacidad garantizada: Estas métricas reflejan el uso de la infraestructura sin acceder a datos personales ni expedientes de clientes.</em>
          </p>
        </div>
        <div class="sa-modal__footer">
          <button class="btn-sm btn-sm--secondary" @click="modalMetricas = false">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- ====== MODAL: NUEVO PLAN SAAS ====== -->
    <div v-if="modalNuevoPlan" class="sa-modal-overlay" @click.self="modalNuevoPlan = false">
      <div class="sa-modal">
        <div class="sa-modal__header">
          <h3>💎 Agregar Nuevo Plan SaaS</h3>
          <button class="sa-modal__close" @click="modalNuevoPlan = false">✕</button>
        </div>
        <div class="sa-modal__body">
          <label>Nombre del Plan *</label>
          <input v-model="nuevoPlan.nombre" type="text" class="sa-input" placeholder="ej: Plan Pro Master" />

          <div class="sa-row-2">
            <div>
              <label>Límite Inferior *</label>
              <input v-model.number="nuevoPlan.limiteInferior" type="number" class="sa-input" placeholder="ej: 41" />
            </div>
            <div>
              <label>Límite Superior (vacío = Ilimitado)</label>
              <input v-model.number="nuevoPlan.limiteSuperior" type="number" class="sa-input" placeholder="ej: 100" />
            </div>
          </div>

          <label>Precio Mensual COP *</label>
          <input v-model.number="nuevoPlan.precioCopMensual" type="number" class="sa-input" placeholder="ej: 500000" />
        </div>
        <div class="sa-modal__footer">
          <button class="btn-sm btn-sm--secondary" @click="modalNuevoPlan = false">Cancelar</button>
          <button class="btn-sm btn-sm--primary" @click="crearPlanSaas">💾 Crear Plan</button>
        </div>
      </div>
    </div>

    <!-- ====== MODAL: NUEVO USUARIO GLOBAL ====== -->
    <div v-if="modalNuevoUsuario" class="sa-modal-overlay" @click.self="modalNuevoUsuario = false">
      <div class="sa-modal">
        <div class="sa-modal__header">
          <h3>➕ Crear Nuevo Usuario</h3>
          <button class="sa-modal__close" @click="modalNuevoUsuario = false">✕</button>
        </div>
        <div class="sa-modal__body">
          <label>Nombre Completo *</label>
          <input v-model="nuevoUser.nombreCompleto" type="text" class="sa-input" placeholder="ej: Juan Carlos Pérez" />

          <label>Usuario (Login / Nickname) *</label>
          <input v-model="nuevoUser.username" type="text" class="sa-input" placeholder="ej: entrenador_juan" />

          <label>Contraseña *</label>
          <input v-model="nuevoUser.password" type="password" class="sa-input" placeholder="Mínimo 6 caracteres" />

          <label>Rol *</label>
          <select v-model="nuevoUser.role" class="sa-select">
            <option value="ADMIN">🛡️ ADMIN (Club)</option>
            <option value="EMPLEADO">🧑‍💼 EMPLEADO (Entrenador)</option>
          </select>

          <template v-if="nuevoUser.role === 'EMPLEADO'">
            <label>Club *</label>
            <select v-model="nuevoUser.clubId" class="sa-select">
              <option :value="null" disabled>Selecciona un club registrado...</option>
              <option v-for="c in clubes" :key="c.id" :value="c.id">{{ c.clubNombre || c.username }}</option>
            </select>
          </template>
          <template v-else>
            <label>Nombre del Club (opcional, solo si NO usas "Nuevo Club")</label>
            <input v-model="nuevoUser.clubNombre" type="text" class="sa-input" placeholder="ej: Club Tigres" />
          </template>
        </div>
        <div class="sa-modal__footer">
          <button class="btn-sm btn-sm--secondary" @click="modalNuevoUsuario = false">Cancelar</button>
          <button class="btn-sm btn-sm--primary" @click="crearUsuarioGlobal">✅ Crear Usuario</button>
        </div>
      </div>
    </div>

    <!-- ====== MODAL: EDITAR USUARIO GLOBAL ====== -->
    <div v-if="modalEditarUsuario" class="sa-modal-overlay" @click.self="cerrarModalEditarUsuario">
      <div class="sa-modal">
        <div class="sa-modal__header">
          <h3>✏️ Editar Usuario — {{ usuarioEditando?.nombreCompleto || usuarioEditando?.username }}</h3>
          <button class="sa-modal__close" @click="cerrarModalEditarUsuario">✕</button>
        </div>
        <div class="sa-modal__body">
          <div v-if="errorModalUsuario" class="sa-alert sa-alert--danger">{{ errorModalUsuario }}</div>

          <label>Nombre Completo</label>
          <input v-model="formEditarUsuario.nombreCompleto" type="text" class="sa-input" placeholder="ej: Juan Carlos Pérez" />

          <label>Usuario (Login)</label>
          <input v-model="formEditarUsuario.username" type="text" class="sa-input" placeholder="ej: entrenador_juan" />

          <label>Nueva Contraseña (dejar en blanco para conservar)</label>
          <input v-model="formEditarUsuario.password" type="password" class="sa-input" placeholder="Mínimo 6 caracteres" />

          <label>Confirmar Nueva Contraseña</label>
          <input v-model="formEditarUsuario.confirmPassword" type="password" class="sa-input" placeholder="Repite la nueva contraseña" />

          <label>Rol</label>
          <select v-model="formEditarUsuario.role" class="sa-select">
            <option value="ADMIN">🛡️ ADMIN (Club)</option>
            <option value="EMPLEADO">🧑‍💼 EMPLEADO (Entrenador)</option>
          </select>

          <template v-if="formEditarUsuario.role === 'EMPLEADO'">
            <label>Club *</label>
            <select v-model="formEditarUsuario.clubId" class="sa-select">
              <option :value="null" disabled>Selecciona un club registrado...</option>
              <option v-for="c in clubes" :key="c.id" :value="c.id">{{ c.clubNombre || c.username }}</option>
            </select>
          </template>
          <template v-else>
            <label>Club</label>
            <input :value="formEditarUsuario.clubNombre || '— (edítalo desde Clubs Registrados)'" type="text" class="sa-input" disabled />
          </template>
        </div>
        <div class="sa-modal__footer">
          <button class="btn-sm btn-sm--secondary" @click="cerrarModalEditarUsuario">Cancelar</button>
          <button class="btn-sm btn-sm--primary" :disabled="guardandoUsuario" @click="guardarUsuarioEditado">
            {{ guardandoUsuario ? 'Guardando...' : '💾 Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const subTab = ref(route.query.tab || 'clubes')

watch(() => route.query.tab, (newTab) => {
  if (newTab) subTab.value = newTab
})

const clubes = ref([])
const planes = ref([])
const usuarios = ref([])
const cargando = ref(false)
const busqueda = ref('')
const filtroClubId = ref(null)
const busquedaUsuario = ref('')
const filtroRol = ref('')
const activeMenuClubId = ref(null)

// Modal Nuevo Club
const modalNuevoClub = ref(false)
const creandoClub = ref(false)
const errorModal = ref('')
const nuevoClub = ref({ username: '', password: '', clubNombre: '', nombreAdministrador: '', fechaCorte: '', planActual: 'TRAMO_1', exentoTarifa: false })

// Modal Editar Club
const modalEditarClub = ref(false)
const clubEditando = ref(null)
const guardandoEdicion = ref(false)
const formEditar = ref({ clubNombre: '', nombreAdministrador: '', fechaCorte: '', planActual: 'TRAMO_1', username: '', password: '', exentoTarifa: false })

// Modal Métricas Club
const modalMetricas = ref(false)
const metricasClub = ref(null)
const cargandoMetricas = ref(false)

// Modal y edición Planes SaaS
const modalNuevoPlan = ref(false)
const nuevoPlan = ref({ nombre: '', limiteInferior: 1, limiteSuperior: null, precioCopMensual: 150000 })
const planEditandoId = ref(null)
const formPlanEdit = ref({ nombre: '', limiteInferior: 1, limiteSuperior: null, precioCopMensual: 0 })

// Modal Nuevo Usuario Global
const modalNuevoUsuario = ref(false)
const nuevoUser = ref({ nombreCompleto: '', username: '', password: '', role: 'EMPLEADO', clubNombre: '', clubId: null })

// Modal Editar Usuario Global
const modalEditarUsuario = ref(false)
const usuarioEditando = ref(null)
const guardandoUsuario = ref(false)
const errorModalUsuario = ref('')
const formEditarUsuario = ref({ nombreCompleto: '', username: '', password: '', confirmPassword: '', role: 'EMPLEADO', clubNombre: '', clubId: null })

// Al desmarcar "exento de tarifa" el club deja de poder quedarse sin fechaCorte (o nunca se
// suspendería por mora) — se autocompleta con +1 mes desde hoy si el campo está vacío, igual
// que el fallback que aplica el backend cuando no se envía una fecha explícita.
function fechaCortePorDefecto() {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}
watch(() => nuevoClub.value.exentoTarifa, (esExento, eraExento) => {
  if (eraExento && !esExento && !nuevoClub.value.fechaCorte) {
    nuevoClub.value.fechaCorte = fechaCortePorDefecto()
  }
})
watch(() => formEditar.value.exentoTarifa, (esExento, eraExento) => {
  if (eraExento && !esExento && !formEditar.value.fechaCorte) {
    formEditar.value.fechaCorte = fechaCortePorDefecto()
  }
})

// Un usuario está "sin club real" cuando su clubId no coincide con ningún club
// realmente registrado (club renombrado, eliminado, o usuario creado sin club).
function clubExiste(clubId) {
  if (clubId == null) return false
  return clubes.value.some(c => c.id === clubId)
}

// Computed
const clubesActivos = computed(() => clubes.value.filter(c => c.clubEstado !== 'SUSPENDIDO_POR_MORA').length)
const clubesSuspendidos = computed(() => clubes.value.filter(c => c.clubEstado === 'SUSPENDIDO_POR_MORA').length)
const clubesFiltrados = computed(() => {
  let list = clubes.value
  if (filtroClubId.value != null) {
    list = list.filter(c => c.id === filtroClubId.value)
  }
  const q = busqueda.value.toLowerCase().trim()
  if (q) {
    list = list.filter(c =>
      (c.clubNombre || '').toLowerCase().includes(q) ||
      (c.nombreAdministrador || '').toLowerCase().includes(q) ||
      (c.username || '').toLowerCase().includes(q)
    )
  }
  return list
})

const usuariosFiltrados = computed(() => {
  let list = usuarios.value.filter(u => u.role === 'ADMIN' || u.role === 'EMPLEADO')
  if (filtroRol.value) {
    list = list.filter(u => u.role === filtroRol.value)
  }
  const q = busquedaUsuario.value.toLowerCase().trim()
  if (q) {
    list = list.filter(u =>
      (u.nombreCompleto || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.clubNombre || '').toLowerCase().includes(q)
    )
  }
  return list
})

onMounted(async () => {
  await Promise.all([cargarClubes(), cargarPlanes(), cargarUsuarios()])
})

async function cargarClubes() {
  cargando.value = true
  try {
    const res = await axios.get('/api/superadmin/clubes')
    clubes.value = res.data
  } catch (e) {
    console.error('Error al cargar clubes:', e)
  } finally {
    cargando.value = false
  }
}

async function cargarPlanes() {
  try {
    const res = await axios.get('/api/superadmin/planes')
    planes.value = res.data
  } catch (e) {
    console.error('Error al cargar planes:', e)
  }
}

async function cargarUsuarios() {
  try {
    const res = await axios.get('/api/superadmin/usuarios')
    usuarios.value = res.data
  } catch (e) {
    console.error('Error al cargar usuarios:', e)
  }
}

function toggleMenuClub(id) {
  if (activeMenuClubId.value === id) activeMenuClubId.value = null
  else activeMenuClubId.value = id
}

async function verMetricasClub(club) {
  activeMenuClubId.value = null
  modalMetricas.value = true
  cargandoMetricas.value = true
  metricasClub.value = null
  try {
    const res = await axios.get(`/api/superadmin/clubes/${club.id}/metricas`)
    metricasClub.value = res.data
  } catch (e) {
    alert('Error al consultar métricas: ' + (e.response?.data?.error || e.message))
  } finally {
    cargandoMetricas.value = false
  }
}

async function suspenderClub(club) {
  activeMenuClubId.value = null
  if (!confirm(`¿Suspender el club "${club.clubNombre || club.username}" por mora?`)) return
  try {
    await axios.put(`/api/superadmin/clubes/${club.id}/suspender`)
    await cargarClubes()
  } catch (e) {
    alert('Error al suspender: ' + (e.response?.data?.error || e.message))
  }
}

async function activarClub(club) {
  activeMenuClubId.value = null
  if (!confirm(`¿Reactivar el club "${club.clubNombre || club.username}"?`)) return
  try {
    await axios.put(`/api/superadmin/clubes/${club.id}/activar`)
    await cargarClubes()
  } catch (e) {
    alert('Error al activar: ' + (e.response?.data?.error || e.message))
  }
}

async function eliminarClub(club) {
  activeMenuClubId.value = null
  const nombre = club.clubNombre || club.username
  if (!confirm(`🚨 ¿Eliminar PERMANENTEMENTE el club "${nombre}"?\n\nEsto borrará todos sus padres, deportistas, asistencias, sedes, empleados e historial financiero. Esta acción NO se puede deshacer.`)) return
  try {
    await axios.delete(`/api/superadmin/clubes/${club.id}`)
    await cargarClubes()
  } catch (e) {
    alert('Error al eliminar: ' + (e.response?.data?.error || e.message))
  }
}

function abrirModalNuevoClub() {
  nuevoClub.value = { username: '', password: '', clubNombre: '', nombreAdministrador: '', fechaCorte: '', planActual: 'TRAMO_1', exentoTarifa: false }
  errorModal.value = ''
  modalNuevoClub.value = true
}
function cerrarModalNuevoClub() { modalNuevoClub.value = false }

async function crearClub() {
  errorModal.value = ''
  if (!nuevoClub.value.username || !nuevoClub.value.password || !nuevoClub.value.clubNombre) {
    errorModal.value = 'Usuario, contraseña y nombre del club son obligatorios.'
    return
  }
  if (nuevoClub.value.password.length < 6) {
    errorModal.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  creandoClub.value = true
  try {
    await axios.post('/api/superadmin/clubes', { ...nuevoClub.value, exentoTarifa: String(nuevoClub.value.exentoTarifa) })
    cerrarModalNuevoClub()
    await cargarClubes()
  } catch (e) {
    errorModal.value = e.response?.data?.error || 'Error al crear el club.'
  } finally {
    creandoClub.value = false
  }
}

function editarClub(club) {
  activeMenuClubId.value = null
  clubEditando.value = club
  formEditar.value = {
    clubNombre: club.clubNombre || '',
    nombreAdministrador: club.nombreAdministrador || '',
    fechaCorte: club.fechaCorte || '',
    planActual: club.planActual || 'TRAMO_1',
    username: club.username || '',
    password: '',
    exentoTarifa: !!club.exentoTarifa
  }
  errorModal.value = ''
  modalEditarClub.value = true
}
function cerrarModalEditar() { modalEditarClub.value = false }

async function guardarEdicion() {
  errorModal.value = ''
  if (formEditar.value.password && formEditar.value.password.length < 6) {
    errorModal.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  guardandoEdicion.value = true
  try {
    await axios.put(`/api/superadmin/clubes/${clubEditando.value.id}`, { ...formEditar.value, exentoTarifa: String(formEditar.value.exentoTarifa) })
    cerrarModalEditar()
    await cargarClubes()
  } catch (e) {
    errorModal.value = e.response?.data?.error || 'Error al guardar los cambios.'
  } finally {
    guardandoEdicion.value = false
  }
}

// PLANES SAAS
function abrirModalNuevoPlan() {
  nuevoPlan.value = { nombre: '', limiteInferior: 1, limiteSuperior: null, precioCopMensual: 150000 }
  modalNuevoPlan.value = true
}
async function crearPlanSaas() {
  if (!nuevoPlan.value.nombre || !nuevoPlan.value.precioCopMensual) return
  try {
    await axios.post('/api/superadmin/planes', nuevoPlan.value)
    modalNuevoPlan.value = false
    await cargarPlanes()
  } catch (e) {
    alert('Error al crear plan: ' + e.message)
  }
}
function iniciarEditarPlan(plan) {
  planEditandoId.value = plan.id
  formPlanEdit.value = { ...plan }
}
async function guardarEdicionPlan(planId) {
  try {
    await axios.put(`/api/superadmin/planes/${planId}`, formPlanEdit.value)
    planEditandoId.value = null
    await cargarPlanes()
  } catch (e) {
    alert('Error al editar plan: ' + e.message)
  }
}
async function eliminarPlan(plan) {
  if (!confirm(`¿Eliminar el plan "${plan.nombre}"?`)) return
  try {
    await axios.delete(`/api/superadmin/planes/${plan.id}`)
    await cargarPlanes()
  } catch (e) {
    alert('Error al eliminar plan: ' + e.message)
  }
}

// USUARIOS GLOBALES
function abrirModalNuevoUsuario() {
  nuevoUser.value = { nombreCompleto: '', username: '', password: '', role: 'EMPLEADO', clubNombre: '', clubId: null }
  modalNuevoUsuario.value = true
}
async function crearUsuarioGlobal() {
  if (!nuevoUser.value.username || !nuevoUser.value.password) return
  if (nuevoUser.value.password.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres.')
    return
  }
  if (nuevoUser.value.role === 'EMPLEADO' && !nuevoUser.value.clubId) {
    alert('Selecciona el club al que pertenece este empleado.')
    return
  }
  try {
    await axios.post('/api/superadmin/usuarios', nuevoUser.value)
    modalNuevoUsuario.value = false
    await cargarUsuarios()
  } catch (e) {
    alert('Error al crear usuario: ' + (e.response?.data?.error || e.message))
  }
}

function editarUsuario(user) {
  usuarioEditando.value = user
  errorModalUsuario.value = ''
  formEditarUsuario.value = {
    nombreCompleto: user.nombreCompleto || '',
    username: user.username || '',
    password: '',
    confirmPassword: '',
    role: user.role || 'EMPLEADO',
    clubNombre: user.clubNombre || '',
    clubId: clubExiste(user.clubId) ? user.clubId : null
  }
  modalEditarUsuario.value = true
}

function cerrarModalEditarUsuario() {
  modalEditarUsuario.value = false
  usuarioEditando.value = null
}

async function guardarUsuarioEditado() {
  errorModalUsuario.value = ''

  if (formEditarUsuario.value.password || formEditarUsuario.value.confirmPassword) {
    if (formEditarUsuario.value.password !== formEditarUsuario.value.confirmPassword) {
      errorModalUsuario.value = 'Las contraseñas no coinciden.'
      return
    }
    if (formEditarUsuario.value.password.length < 6) {
      errorModalUsuario.value = 'La contraseña debe tener al menos 6 caracteres.'
      return
    }
  }

  if (formEditarUsuario.value.role === 'EMPLEADO' && !formEditarUsuario.value.clubId) {
    errorModalUsuario.value = 'Selecciona el club al que pertenece este empleado.'
    return
  }

  guardandoUsuario.value = true
  try {
    await axios.put(`/api/superadmin/usuarios/${usuarioEditando.value.id}`, {
      nombreCompleto: formEditarUsuario.value.nombreCompleto,
      username: formEditarUsuario.value.username,
      password: formEditarUsuario.value.password,
      role: formEditarUsuario.value.role,
      clubId: formEditarUsuario.value.role === 'EMPLEADO' ? formEditarUsuario.value.clubId : null
    })
    cerrarModalEditarUsuario()
    await cargarUsuarios()
  } catch (e) {
    errorModalUsuario.value = e.response?.data?.error || 'Error al guardar el usuario.'
  } finally {
    guardandoUsuario.value = false
  }
}

async function eliminarUsuario(user) {
  if (user.role === 'ADMIN') {
    alert('No puedes eliminar un ADMIN de club desde aquí. Ve a "Clubs Registrados", suspéndelo por mora y usa "Eliminar Definitivamente" — así se borran también sus padres, deportistas y sedes de forma segura.')
    return
  }
  if (!confirm(`¿Eliminar al usuario "${user.nombreCompleto || user.username}" (@${user.username})?`)) return
  try {
    await axios.delete(`/api/superadmin/usuarios/${user.id}`)
    await cargarUsuarios()
  } catch (e) {
    alert('Error al eliminar usuario: ' + (e.response?.data?.error || e.message))
  }
}

// HELPERS
function mapPlanEnum(plan) {
  if (!plan) return 'TRAMO_1'
  const sorted = [...planes.value].sort((a, b) => a.limiteInferior - b.limiteInferior)
  const idx = sorted.findIndex(p => p.id === plan.id)
  if (idx === -1) {
    if (plan.limiteInferior <= 20) return 'TRAMO_1'
    if (plan.limiteInferior <= 40) return 'TRAMO_2'
    return 'TRAMO_3'
  }
  if (idx === 0) return 'TRAMO_1'
  if (idx === 1) return 'TRAMO_2'
  return 'TRAMO_3'
}
function formatCOP(val) {
  if (val == null) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)
}
function formatFecha(val) {
  if (!val) return '—'
  return new Date(val + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatPlanNombre(plan) {
  if (!plan) return '—'
  const sorted = [...planes.value].sort((a, b) => a.limiteInferior - b.limiteInferior)
  if (plan === 'TRAMO_1' && sorted.length > 0) return sorted[0].nombre
  if (plan === 'TRAMO_2' && sorted.length > 1) return sorted[1].nombre
  if (plan === 'TRAMO_3' && sorted.length > 2) return sorted[2].nombre
  const map = { TRAMO_1: 'Semillero (20)', TRAMO_2: 'Pro (40)', TRAMO_3: 'Elite (Ilimitado)' }
  return map[plan] || plan
}
</script>

<style scoped>
.superadmin-view { padding: var(--space-6) 0; display: flex; flex-direction: column; gap: var(--space-6); }
.superadmin-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
.superadmin-header__badge { display: inline-block; background: linear-gradient(135deg, #fbbf24, #f97316); color: #0a0a0a; font-weight: 700; font-size: 0.75rem; padding: 3px 10px; border-radius: 999px; text-transform: uppercase; margin-bottom: var(--space-2); }
.superadmin-header__title { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); margin: 0 0 var(--space-2); }
.superadmin-header__subtitle { font-size: 0.9rem; color: var(--text-secondary); margin: 0; max-width: 620px; }
.superadmin-header__actions { display: flex; gap: var(--space-2); }

.superadmin-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-4); }
.stat-card { background: var(--card-bg); border: 1px solid var(--border-primary); border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5); display: flex; align-items: center; gap: var(--space-4); box-shadow: var(--shadow-sm); }
.stat-card__icon { font-size: 2rem; }
.stat-card__body { display: flex; flex-direction: column; }
.stat-card__value { font-size: 1.8rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
.stat-card__label { font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; }

/* Subtabs */
.sa-tabs { display: flex; gap: var(--space-2); border-bottom: 1px solid var(--border-primary); padding-bottom: var(--space-1); }
.sa-tab-btn { background: none; border: none; border-bottom: 2px solid transparent; padding: 10px 16px; font-weight: 600; color: var(--text-secondary); cursor: pointer; }
.sa-tab-btn--active { color: var(--orange-500); border-bottom-color: var(--orange-500); }

.superadmin-section { background: var(--card-bg); border: 1px solid var(--border-primary); border-radius: var(--radius-lg); padding: var(--space-5) var(--space-6); }
.superadmin-section__header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-5); flex-wrap: wrap; }
.superadmin-section__title { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin: 0; }
.superadmin-section__desc { font-size: 0.85rem; color: var(--text-secondary); margin: 4px 0 0; }

.sa-search, .sa-select { background: var(--input-bg); border: 1px solid var(--border-primary); border-radius: var(--radius-md); color: var(--text-primary); padding: 8px 14px; font-size: 0.9rem; }
.sa-filters-row { display: flex; gap: var(--space-3); margin-bottom: var(--space-4); flex-wrap: wrap; }
.sa-checkbox-row { display: flex; align-items: center; gap: 8px; }
.sa-checkbox-label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }

/* Table Container (no horizontal scroll needed) */
.sa-table-container { width: 100%; }
.sa-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; table-layout: auto; }
.sa-table th { background: var(--bg-tertiary); color: var(--text-secondary); font-size: 0.78rem; text-transform: uppercase; padding: 10px 12px; text-align: left; }
.sa-table td { padding: 12px 12px; border-bottom: 1px solid var(--border-secondary); color: var(--text-primary); vertical-align: middle; }
.sa-table__nombre { font-weight: 600; }

.sa-user-info { display: flex; flex-direction: column; }
.sa-user-info__name { font-weight: 600; color: var(--text-primary); }
.sa-user-info__login { font-size: 0.78rem; color: var(--text-secondary); font-family: monospace; }

.sa-badge { display: inline-flex; padding: 3px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 600; }
.sa-badge--success { background: rgba(22, 163, 74, 0.12); color: #16a34a; }
.sa-badge--danger  { background: rgba(220, 38, 38, 0.12); color: #dc2626; }
.sa-badge--user    { background: var(--bg-tertiary); color: var(--text-secondary); font-family: monospace; }
.sa-badge--plan    { background: rgba(251, 191, 36, 0.12); color: #d97706; }

.sa-popover-btn { background: var(--bg-tertiary); border: 1px solid var(--border-primary); color: var(--text-primary); width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer; transition: all 0.15s ease; }
.sa-popover-btn:hover { background: var(--orange-500); color: #fff; border-color: var(--orange-500); }

.sa-table__dropdown-menu-wrapper { position: relative; display: inline-block; }
.sa-action-dropdown { position: absolute; right: 0; top: 100%; background: var(--card-bg); border: 1px solid var(--border-primary); border-radius: var(--radius-md); box-shadow: var(--shadow-xl); z-index: 100; min-width: 180px; display: flex; flex-direction: column; padding: 4px 0; }
.sa-action-dropdown__item { padding: 8px 14px; background: none; border: none; text-align: left; font-size: 0.85rem; color: var(--text-primary); cursor: pointer; }
.sa-action-dropdown__item:hover { background: var(--bg-tertiary); }
.sa-action-dropdown__item--danger { color: #dc2626; }
.sa-action-dropdown__item--success { color: #16a34a; }

/* Modern Planes Cards */
.sa-planes-modern-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-4); }
.sa-plan-card-modern { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-lg); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); transition: border-color 0.2s ease; }
.sa-plan-card-modern:hover { border-color: var(--orange-500); }
.sa-plan-card-modern__header { display: flex; align-items: center; justify-content: space-between; }
.sa-plan-card-modern__title { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.sa-plan-card-modern__tag { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; background: rgba(249, 115, 22, 0.12); color: var(--orange-500); padding: 2px 8px; border-radius: 999px; }
.sa-plan-card-modern__price { font-size: 1.8rem; font-weight: 800; color: var(--orange-500); line-height: 1; margin-top: 4px; }
.sa-plan-card-modern__period { font-size: 0.85rem; font-weight: 400; color: var(--text-secondary); }
.sa-plan-card-modern__meta { font-size: 0.85rem; color: var(--text-secondary); margin-top: 6px; }
.sa-plan-card-modern__actions { display: flex; gap: var(--space-2); margin-top: var(--space-3); }

.sa-plan-card-modern__edit-form { display: flex; flex-direction: column; gap: 8px; }
.sa-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.sa-label-sm { font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); }
.sa-input--sm { padding: 6px 10px; font-size: 0.85rem; }

/* Métricas modal */
.metricas-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4); }
.metrica-card { background: var(--bg-secondary); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--border-secondary); text-align: center; }
.metrica-icon { font-size: 1.5rem; }
.metrica-val { font-size: 1.5rem; font-weight: 700; color: var(--orange-500); }
.metrica-lbl { font-size: 0.78rem; color: var(--text-secondary); }
.sa-privacy-note { font-size: 0.8rem; color: var(--text-secondary); background: rgba(251, 191, 36, 0.08); padding: 8px 12px; border-radius: var(--radius-sm); margin: 0; }

/* Modales */
.sa-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: var(--space-4); }
.sa-modal { background: var(--card-bg); border: 1px solid var(--border-primary); border-radius: var(--radius-lg); width: 100%; max-width: 480px; box-shadow: var(--shadow-xl); display: flex; flex-direction: column; }
.sa-modal__header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border-primary); }
.sa-modal__header h3 { margin: 0; font-size: 1rem; color: var(--text-primary); }
.sa-modal__close { background: none; border: none; cursor: pointer; font-size: 1.1rem; color: var(--text-secondary); }
.sa-modal__body { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); }
.sa-modal__body label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
.sa-modal__footer { padding: var(--space-4) var(--space-5); border-top: 1px solid var(--border-primary); display: flex; justify-content: flex-end; gap: var(--space-2); }

.btn-premium { padding: 9px 18px; border-radius: var(--radius-md); font-weight: 600; font-size: 0.88rem; cursor: pointer; border: none; }
.btn-premium--primary { background: var(--orange-500); color: #fff; }
.btn-premium--secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-primary); }
.btn-sm { padding: 5px 12px; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
.btn-sm--primary { background: var(--orange-500); color: #fff; }
.btn-sm--secondary { background: var(--bg-tertiary); color: var(--text-secondary); border-color: var(--border-primary); }
.btn-sm--danger { background: rgba(220, 38, 38, 0.1); color: #dc2626; border-color: rgba(220, 38, 38, 0.3); }
.sa-alert--danger { background: rgba(220, 38, 38, 0.1); color: #dc2626; padding: 8px 12px; border-radius: var(--radius-md); font-size: 0.85rem; }
.sa-loading, .sa-empty { text-align: center; padding: var(--space-8); color: var(--text-secondary); }
</style>
