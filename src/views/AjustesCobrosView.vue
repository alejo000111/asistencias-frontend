<template>
  <div class="cobros-view">
    <!-- ====== HEADER ====== -->
    <div class="cobros-header">
      <div>
        <h1 class="cobros-header__title">💰 Ajustes de Cobro y Lógica de Negocio</h1>
        <p class="cobros-header__subtitle">
          Configura libremente los parámetros condicionales de cobro, sedes, matrículas y seguros deportivos.
        </p>
      </div>
      <div v-if="guardado" class="cobros-success-banner">
        ✅ Configuración guardada exitosamente
      </div>
    </div>

    <!-- ====== LOADING ====== -->
    <div v-if="cargando" class="cobros-loading">
      <div class="spinner-premium"></div>
      <span>Cargando configuración...</span>
    </div>

    <template v-else>
      <!-- ====== SECCIÓN 1: PARÁMETROS DE COBRO ====== -->
      <section class="cobros-section">
        <div class="cobros-section__header" @click="collapsedSections.parametrosCobro = !collapsedSections.parametrosCobro" style="cursor: pointer;">
          <span class="cobros-section__icon">📋</span>
          <div style="flex: 1;">
            <h2 class="cobros-section__title">Parámetros de Cobro</h2>
            <p class="cobros-section__desc">
              Esquema actual: <strong>{{ etiquetaEsquemaCobro }}</strong> —
              para cambiarlo, ve a <router-link to="/configuracion">Configuración</router-link>.
            </p>
          </div>
          <span class="ms-auto fs-4">{{ collapsedSections.parametrosCobro ? '➕' : '➖' }}</span>
        </div>

        <div v-show="!collapsedSections.parametrosCobro">
        <!-- MÓDULO CONDICIONAL 1: PARÁMETROS SEGÚN ESQUEMA SELECCIONADO -->
        <div class="cobros-conditional-box mt-4">

          <!-- CASO 1: MENSUALIDAD -->
          <div v-if="config.esquemaCobro === 'MENSUALIDAD'" class="cobros-sub-config">
            <h4 class="cobros-sub-title">⚙️ Parámetros de Mensualidad y Calendario</h4>

            <!-- Bloque 1: Calendario de Fechas de Corte (¡SIEMPRE VISIBLE!) -->
            <div class="border rounded p-3 mb-3" style="background: var(--card-bg); border-color: var(--border-primary) !important;">
              <h6 class="fw-bold mb-2" style="color: var(--text-primary);">📅 Calendario de Tarifas</h6>
              <p class="small mb-3" style="color: var(--text-secondary);">
                Define hasta qué día aplica cada tarifa. Usa <strong>0</strong> para no usar la Preferencial o la Mora.
              </p>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="cobros-field__label">Tarifa Preferencial: válida hasta el día (0 = desactivada)</label>
                  <input
                    :value="config.diaLimitePreferencial"
                    @input="onDiaLimitePreferencialInput($event.target.value)"
                    type="number"
                    min="0"
                    max="31"
                    class="cobros-input"
                    placeholder="ej: 5, o 0 si no aplicas"
                  />
                </div>
                <div class="col-md-6">
                  <label class="cobros-field__label">Tarifa con Mora: aplica desde el día (0 = desactivada)</label>
                  <input
                    :value="config.diaCorteMora"
                    @input="onDiaCorteMoraInput($event.target.value)"
                    type="number"
                    min="0"
                    max="31"
                    class="cobros-input"
                    placeholder="ej: 15, o 0 si no aplicas"
                  />
                </div>
              </div>
              <p v-if="calendarioError" class="cobros-calendario-error">⚠️ {{ calendarioError }}</p>
            </div>

            <!-- ========================================== -->
            <!-- 2. GESTIÓN DE PLANES Y TARIFAS             -->
            <!-- ========================================== -->

            <div v-if="!config.preciosDiferenciados" class="border rounded p-3 mb-3" style="background: var(--card-bg); border-color: var(--border-primary) !important;">
              <h5 class="fw-bold mb-3" style="color: var(--text-primary);">🌎 Tarifa General y Planes Globales</h5>
              <p class="small mb-3" style="color: var(--text-secondary);">
                Al tener precios unificados, esta tarifa por defecto y estos planes aplicarán a <strong>todas las sedes</strong> del club.
              </p>

              <!-- Tarifa General por Defecto -->
              <h6 class="fw-bold mb-2" style="color: var(--text-primary);">💲 Tarifa por Defecto (deportistas sin plan propio asignado)</h6>
              <div class="cobros-tarifa-timeline mb-4">
                <div v-if="preferencialActiva" class="cobros-tarifa-card cobros-tarifa-card--preferencial">
                  <div class="cobros-tarifa-card__badge">Día 1 al {{ config.diaLimitePreferencial }}</div>
                  <label class="cobros-field__label">💚 Tarifa Preferencial ($)</label>
                  <input :value="formatInputCurrency(config.montoPreferencial)" @input="config.montoPreferencial = parseCurrencyInput($event.target.value)" type="text" class="cobros-input" placeholder="$ 90.000" />
                </div>
                <div class="cobros-tarifa-card cobros-tarifa-card--actual">
                  <div class="cobros-tarifa-card__badge">Día {{ rangoActualInicio }} al {{ rangoActualFin }}</div>
                  <label class="cobros-field__label">🔵 Tarifa Actual ($)</label>
                  <input :value="formatInputCurrency(config.montoEstandar)" @input="config.montoEstandar = parseCurrencyInput($event.target.value)" type="text" class="cobros-input" placeholder="$ 100.000" />
                </div>
                <div v-if="moraActiva" class="cobros-tarifa-card cobros-tarifa-card--mora">
                  <div class="cobros-tarifa-card__badge">Día {{ rangoMoraInicio }} en adelante</div>
                  <label class="cobros-field__label">🔴 Tarifa con Mora ($)</label>
                  <input :value="formatInputCurrency(config.montoMora)" @input="config.montoMora = parseCurrencyInput($event.target.value)" type="text" class="cobros-input" placeholder="$ 115.000" />
                </div>
              </div>

              <!-- Planes Globales -->
              <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <h6 class="fw-bold mb-0" style="color: var(--text-primary);">📋 Planes de Mensualidad Globales</h6>
                <button type="button" class="btn btn-sm btn-outline-primary" @click="crearPlanVacio('global')">+ Nuevo plan global</button>
              </div>
              <div v-if="(planesPorSede['global'] || []).length === 0" class="text-muted small mb-3">
                Sin planes globales creados. Se usará la tarifa por defecto.
              </div>
              <div v-else class="tabla-planes-scroll mb-3">
                <table class="tabla-planes">
                  <thead>
                    <tr>
                      <th class="col-nombre">Plan</th>
                      <th v-for="esc in escenariosActivos" :key="esc.id" class="col-num">{{ etiquetaEscenario(esc) }}</th>
                      <th v-if="preferencialActiva" class="col-money">💚 Preferencial</th>
                      <th class="col-money">🔵 Estándar</th>
                      <th v-if="moraActiva" class="col-money">🔴 Mora</th>
                      <th class="col-acciones"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(plan, pIdx) in (planesPorSede['global'] || [])" :key="plan.id ?? ('nuevo-' + pIdx)" :class="{ 'fila-sucia': plan.dirty }">
                      <td data-label="Plan"><input type="text" v-model="plan.nombre" @input="plan.dirty = true" class="celda-input" placeholder="Ej. Básico" /></td>
                      <td v-for="esc in escenariosActivos" :key="esc.id" :data-label="etiquetaEscenario(esc)">
                        <input type="number" min="0" :value="plan.cupos[esc.id] ?? null" @input="setCupo(plan, esc.id, $event.target.value)" class="celda-input celda-input--num" placeholder="—" />
                      </td>
                      <td v-if="preferencialActiva" data-label="Preferencial">
                        <input type="text" :value="formatInputCurrency(plan.montoPreferencial)" @input="plan.montoPreferencial = parseCurrencyInput($event.target.value); plan.dirty = true" class="celda-input" placeholder="$ 0" />
                      </td>
                      <td data-label="Estándar">
                        <input type="text" :value="formatInputCurrency(plan.montoEstandar)" @input="plan.montoEstandar = parseCurrencyInput($event.target.value); plan.dirty = true" class="celda-input" placeholder="$ 0" />
                      </td>
                      <td v-if="moraActiva" data-label="Mora">
                        <input type="text" :value="formatInputCurrency(plan.montoMora)" @input="plan.montoMora = parseCurrencyInput($event.target.value); plan.dirty = true" class="celda-input" placeholder="$ 0" />
                      </td>
                      <td data-label=""><button type="button" class="btn btn-danger btn-sm" title="Eliminar plan" @click="onEliminarPlan('global', plan)">🗑️</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Tarifa Clase Suelta (Global) -->
              <h6 class="fw-bold mt-4 mb-2" style="color: var(--text-primary);">⚡ Tarifa Clase Suelta (Sin Mensualidad)</h6>
              <p class="small mb-2" style="color: var(--text-secondary);">
                Precio para quienes toman una sola clase sin estar matriculados en un plan mensual.
                <strong>También es el valor que se cobra cuando un deportista SÍ tiene plan pero se
                excede de su cupo</strong> (ej. su plan incluye 1 clase de Cancha por semana y toma 2),
                a menos que definas un valor distinto para esa sede más abajo en "Precios Diferenciados".
              </p>
              <div class="row g-2 mb-3">
                <div class="col-md-6">
                  <label class="cobros-field__label">Clase Suelta ($)</label>
                  <input
                    :value="formatInputCurrency(config.precioClaseGrupal)"
                    @input="config.precioClaseGrupal = parseCurrencyInput($event.target.value)"
                    type="text"
                    class="cobros-input"
                    placeholder="$ 25.000"
                  />
                </div>
              </div>
            </div>

            <!-- PRECIOS DIFERENCIADOS POR SEDE -->
            <div v-else class="border rounded p-3 mb-3" style="background: var(--card-bg); border-color: var(--border-primary) !important;">
              <h5 class="fw-bold mb-3" style="color: var(--text-primary);">🏢 Tarifas y Planes por Sede</h5>
              <p class="small mb-3" style="color: var(--text-secondary);">
                Has activado los precios diferenciados. Configura la tarifa por defecto y los planes específicos para cada sede.
              </p>

              <div v-for="sede in sedes" :key="sede.id" class="sede-planes-bloque" style="padding-top: 15px; border-top: 2px solid var(--border-primary); margin-top: 15px;">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <h5 class="mb-0 fw-bold" style="color: var(--text-primary);">
                    🏢 {{ sede.nombre }}
                    <span v-if="sede.escenario" class="badge-escenario">{{ sede.escenario.emoji || '📍' }} {{ sede.escenario.nombre }}</span>
                  </h5>
                </div>

                <!-- Planes de la Sede -->
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                  <h6 class="fw-bold mb-0" style="color: var(--text-secondary); font-size: 0.9rem;">📋 Planes Específicos de la Sede</h6>
                  <button type="button" class="btn btn-sm btn-outline-primary" @click="crearPlanVacio(sede.id)">+ Nuevo plan</button>
                </div>
                <div v-if="(planesPorSede[sede.id] || []).length === 0" class="text-muted small mb-3">
                  Sin planes propios todavía. Se usará la tarifa por defecto.
                </div>
                <div v-else class="tabla-planes-scroll mb-3">
                  <table class="tabla-planes">
                    <thead>
                      <tr>
                        <th class="col-nombre">Plan</th>
                        <th v-for="esc in escenariosActivos" :key="esc.id" class="col-num">{{ etiquetaEscenario(esc) }}</th>
                        <th v-if="preferencialActiva" class="col-money">💚 Preferencial</th>
                        <th class="col-money">🔵 Estándar</th>
                        <th v-if="moraActiva" class="col-money">🔴 Mora</th>
                        <th class="col-acciones"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(plan, pIdx) in (planesPorSede[sede.id] || [])" :key="plan.id ?? ('nuevo-' + pIdx)" :class="{ 'fila-sucia': plan.dirty }">
                        <td data-label="Plan"><input type="text" v-model="plan.nombre" @input="plan.dirty = true" class="celda-input" placeholder="Ej. Básico" /></td>
                        <td v-for="esc in escenariosActivos" :key="esc.id" :data-label="etiquetaEscenario(esc)">
                          <input type="number" min="0" :value="plan.cupos[esc.id] ?? null" @input="setCupo(plan, esc.id, $event.target.value)" class="celda-input celda-input--num" placeholder="—" />
                        </td>
                        <td v-if="preferencialActiva" data-label="Preferencial">
                          <input type="text" :value="formatInputCurrency(plan.montoPreferencial)" @input="plan.montoPreferencial = parseCurrencyInput($event.target.value); plan.dirty = true" class="celda-input" placeholder="$ 0" />
                        </td>
                        <td data-label="Estándar">
                          <input type="text" :value="formatInputCurrency(plan.montoEstandar)" @input="plan.montoEstandar = parseCurrencyInput($event.target.value); plan.dirty = true" class="celda-input" placeholder="$ 0" />
                        </td>
                        <td v-if="moraActiva" data-label="Mora">
                          <input type="text" :value="formatInputCurrency(plan.montoMora)" @input="plan.montoMora = parseCurrencyInput($event.target.value); plan.dirty = true" class="celda-input" placeholder="$ 0" />
                        </td>
                        <td data-label=""><button type="button" class="btn btn-danger btn-sm" title="Eliminar plan" @click="onEliminarPlan(sede.id, plan)">🗑️</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Valor x Clase de esta sede (excedente de cupo, o clase suelta sin plan) — un
                     solo valor: la distinción Grupal/Personalizada solo aplica al esquema Por
                     Clase. Se guarda igual en ambas claves para que cualquier tipo de clase use
                     este mismo precio. -->
                <div class="cobros-field border rounded p-3 mt-3" style="background: var(--bg-secondary); border-color: var(--border-primary) !important; max-width: 320px;">
                  <label class="cobros-field__label">💰 Valor x Clase (excedente de cupo o sin plan)</label>
                  <input
                    :value="formatInputCurrency(preciosSedes[sede.id]?.grupal)"
                    @input="setPrecioSedeClaseExtra(sede.id, parseCurrencyInput($event.target.value))"
                    type="text"
                    class="cobros-input"
                    placeholder="$ 25.000"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- CASO 2: PAQUETES DE CLASES -->
          <div v-if="config.esquemaCobro === 'PAQUETE'" class="cobros-sub-config">
            <h4 class="cobros-sub-title">📦 Configuración de Paquetes Disponibles</h4>
            <div class="paquetes-grid">
              <div v-for="(paq, idx) in paquetesList" :key="idx" class="paquete-card flex-column align-items-stretch">
                <div class="d-flex align-items-end gap-2 w-100">
                  <div class="cobros-field" style="flex: 1.5;">
                    <label class="cobros-field__label">Nombre del Paquete</label>
                    <input v-model="paq.nombre" type="text" class="cobros-input" placeholder="ej: Paquete 10 Clases" />
                  </div>
                  <div class="cobros-field" style="flex: 1;">
                    <label class="cobros-field__label">Nº de Clases</label>
                    <input v-model.number="paq.clases" type="number" class="cobros-input" placeholder="ej: 10" />
                  </div>
                  <div class="cobros-field" style="flex: 1.5;">
                    <label class="cobros-field__label">Precio Estándar ($)</label>
                    <input
                      :value="formatInputCurrency(paq.precio)"
                      @input="paq.precio = parseCurrencyInput($event.target.value)"
                      type="text"
                      class="cobros-input"
                      placeholder="$ 100.000"
                    />
                  </div>
                  <!-- Botón Eliminar Rojo Sólido -->
                  <button class="btn-delete-solid" @click="quitarPaquete(idx)" title="Eliminar paquete">🗑️</button>
                </div>

                <!-- Sub-formulario Precios por Sede para el Paquete -->
                <div v-if="config.preciosDiferenciados" class="mt-2 pt-2 border-top w-100">
                  <div class="fw-bold small mb-2" style="color: var(--text-primary);">🏢 Tarifas de este Paquete por Sede (opcional, en blanco usa precio estándar):</div>
                  <div v-for="s in sedes" :key="s.id" class="row g-2 align-items-center mb-1">
                    <div class="col-md-5 small fw-semibold" style="color: var(--text-primary);">{{ s.nombre }}</div>
                    <div class="col-md-7">
                      <input
                        :value="formatInputCurrency(paq.preciosSedes?.[s.id])"
                        @input="setPaqueteSedePrecio(paq, s.id, parseCurrencyInput($event.target.value))"
                        type="text"
                        class="cobros-input"
                        :placeholder="'Estándar (' + (formatInputCurrency(paq.precio) || '$ 0') + ')'"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botón Agregar Verde Sólido -->
            <button class="btn-add-solid mt-3" @click="agregarPaquete">➕ Agregar Paquete</button>

            <!-- Valor de Clase Extra (fuera de paquete) -->
            <h6 class="fw-bold mt-4 mb-2" style="color: var(--text-primary);">💰 Valor de Clase Extra (fuera de paquete)</h6>
            <p class="small mb-2" style="color: var(--text-secondary);">
              Se cobra cuando un deportista asiste sin tener clases disponibles en su paquete.
            </p>
            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <label class="cobros-field__label">Valor Global ($)</label>
                <input
                  :value="formatInputCurrency(config.precioClaseGrupal)"
                  @input="config.precioClaseGrupal = parseCurrencyInput($event.target.value)"
                  type="text"
                  class="cobros-input"
                  placeholder="$ 25.000"
                />
              </div>
            </div>
            <div v-if="config.preciosDiferenciados" class="sedes-pricing-list border rounded p-3 mb-3" style="background: var(--bg-secondary); border-color: var(--border-primary) !important;">
              <h6 class="fw-bold mb-2" style="color: var(--text-primary);">🏢 Valor de Clase Extra por Sede</h6>
              <div v-for="sede in sedes" :key="sede.id" class="row g-2 align-items-center mb-2 border-bottom pb-2" style="border-color: var(--border-primary) !important;">
                <div class="col-md-4 fw-semibold small" style="color: var(--text-primary);">{{ sede.nombre }}</div>
                <div class="col-md-8">
                  <input
                    :value="formatInputCurrency(preciosSedes[sede.id]?.grupal)"
                    @input="setPrecioSedeClaseExtra(sede.id, parseCurrencyInput($event.target.value))"
                    type="text"
                    class="cobros-input"
                    placeholder="Valor Clase Extra"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- CASO 3: PAGO POR CLASE -->
          <div v-if="config.esquemaCobro === 'POR_CLASE'" class="cobros-sub-config">
            <h4 class="cobros-sub-title">⚡ Tarifas por Clase Asistida</h4>

            <div v-if="config.preciosDiferenciados" class="sedes-pricing-list border rounded p-3 mb-3" style="background: var(--bg-secondary); border-color: var(--border-primary) !important;">
              <h6 class="fw-bold mb-2" style="color: var(--text-primary);">🏢 Tarifas de Clase por Sede</h6>
              <div v-for="sede in sedes" :key="sede.id" class="row g-2 align-items-center mb-2 border-bottom pb-2" style="border-color: var(--border-primary) !important;">
                <div class="col-md-4 fw-semibold small" style="color: var(--text-primary);">{{ sede.nombre }}</div>
                <div class="col-md-4">
                  <input
                    :value="formatInputCurrency(preciosSedes[sede.id]?.grupal)"
                    @input="setPrecioSede(sede.id, 'grupal', parseCurrencyInput($event.target.value))"
                    type="text"
                    class="cobros-input"
                    placeholder="Clase Grupal"
                  />
                </div>
                <div class="col-md-4">
                  <input
                    :value="formatInputCurrency(preciosSedes[sede.id]?.personalizada)"
                    @input="setPrecioSede(sede.id, 'personalizada', parseCurrencyInput($event.target.value))"
                    type="text"
                    class="cobros-input"
                    placeholder="Clase Personalizada"
                  />
                </div>
              </div>
            </div>

            <div v-else class="cobros-field-row">
              <div class="cobros-field">
                <label class="cobros-field__label">Precio Clase Grupal ($)</label>
                <input
                  :value="formatInputCurrency(config.precioClaseGrupal)"
                  @input="config.precioClaseGrupal = parseCurrencyInput($event.target.value)"
                  type="text"
                  class="cobros-input"
                  placeholder="$ 25.000"
                />
              </div>
              <div class="cobros-field">
                <label class="cobros-field__label">Precio Clase Personalizada ($)</label>
                <input
                  :value="formatInputCurrency(config.precioClasePersonalizada)"
                  @input="config.precioClasePersonalizada = parseCurrencyInput($event.target.value)"
                  type="text"
                  class="cobros-input"
                  placeholder="$ 60.000"
                />
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      <!-- ====== SECCIÓN 2: MATRÍCULA ====== -->
      <section class="cobros-section">
        <div class="cobros-section__header" @click="collapsedSections.matricula = !collapsedSections.matricula" style="cursor: pointer;">
          <span class="cobros-section__icon">🎓</span>
          <div style="flex: 1;">
            <h2 class="cobros-section__title">Matrícula</h2>
            <p class="cobros-section__desc">Configura la vigencia y tipo de cobro de matrícula.</p>
          </div>
          <div class="d-flex align-items-center gap-3">
            <label class="cobros-toggle" :class="{ 'cobros-toggle--on': config.cobraMatricula }" @click.stop>
              <input id="toggle-matricula" type="checkbox" v-model="config.cobraMatricula" class="cobros-toggle__input" />
              <span class="cobros-toggle__thumb"></span>
              <span class="cobros-toggle__label">{{ config.cobraMatricula ? 'Activada' : 'Desactivada' }}</span>
            </label>
            <span class="fs-4">{{ collapsedSections.matricula ? '➕' : '➖' }}</span>
          </div>
        </div>

        <div v-show="!collapsedSections.matricula">
        <div v-if="config.cobraMatricula" class="cobros-sub-config">
          <div class="cobros-field-row">
            <div class="cobros-field">
              <label class="cobros-field__label">Tipo</label>
              <select v-model="config.matriculaObligatoria" class="cobros-select">
                <option :value="true">Obligatoria (Masiva a todos)</option>
                <option :value="false">Opcional (Checkbox por deportista)</option>
              </select>
            </div>
            <div class="cobros-field">
              <label class="cobros-field__label">Regularidad de Pago</label>
              <select v-model="config.regularidadMatricula" class="cobros-select">
                <option value="ANUAL">📆 Anual</option>
                <option value="SEMESTRAL">📅 Semestral</option>
                <option value="MENSUAL">🗓️ Mensual</option>
              </select>
            </div>
            <div class="cobros-field">
              <label class="cobros-field__label">Monto Matrícula ($)</label>
              <input
                :value="formatInputCurrency(config.montoMatricula)"
                @input="config.montoMatricula = parseCurrencyInput($event.target.value)"
                type="text"
                class="cobros-input"
                placeholder="$ 120.000"
              />
            </div>
          </div>

          <!-- SI ES OBLIGATORIA: SELECTOR DE FECHA DE VIGENCIA -->
          <div v-if="config.matriculaObligatoria" class="cobros-field mt-3">
            <label class="cobros-field__label">📅 Fecha de Inicio de Vigencia del Cobro Obligatorio</label>
            <input v-model="config.fechaVigenciaMatricula" type="date" class="cobros-input" style="max-width: 240px;" />
            <span class="small text-muted mt-1">Al guardar, si esta fecha es hoy o anterior, el cobro se aplicará automáticamente a todos los deportistas activos.</span>
          </div>
        </div>
        </div>
      </section>

      <!-- ====== SECCIÓN 3: SEGURO DEPORTIVO ====== -->
      <section class="cobros-section">
        <div class="cobros-section__header" @click="collapsedSections.seguro = !collapsedSections.seguro" style="cursor: pointer;">
          <span class="cobros-section__icon">🛡️</span>
          <div style="flex: 1;">
            <h2 class="cobros-section__title">Seguro Deportivo</h2>
            <p class="cobros-section__desc">Póliza de protección y coberturas de deportistas.</p>
          </div>
          <div class="d-flex align-items-center gap-3">
            <label class="cobros-toggle" :class="{ 'cobros-toggle--on': config.cobraSeguro }" @click.stop>
              <input id="toggle-seguro" type="checkbox" v-model="config.cobraSeguro" class="cobros-toggle__input" />
              <span class="cobros-toggle__thumb"></span>
              <span class="cobros-toggle__label">{{ config.cobraSeguro ? 'Activado' : 'Desactivado' }}</span>
            </label>
            <span class="fs-4">{{ collapsedSections.seguro ? '➕' : '➖' }}</span>
          </div>
        </div>

        <div v-show="!collapsedSections.seguro">
        <div v-if="config.cobraSeguro" class="cobros-sub-config">
          <div class="cobros-field-row">
            <div class="cobros-field">
              <label class="cobros-field__label">Tipo</label>
              <select v-model="config.seguroObligatorio" class="cobros-select">
                <option :value="true">Obligatorio (Masivo a todos)</option>
                <option :value="false">Opcional (Checkbox por deportista)</option>
              </select>
            </div>
            <div class="cobros-field">
              <label class="cobros-field__label">Regularidad de Pago</label>
              <select v-model="config.regularidadSeguro" class="cobros-select">
                <option value="ANUAL">📆 Anual</option>
                <option value="SEMESTRAL">📅 Semestral</option>
                <option value="MENSUAL">🗓️ Mensual</option>
              </select>
            </div>
            <div class="cobros-field">
              <label class="cobros-field__label">Monto Seguro ($)</label>
              <input
                :value="formatInputCurrency(config.montoSeguro)"
                @input="config.montoSeguro = parseCurrencyInput($event.target.value)"
                type="text"
                class="cobros-input"
                placeholder="$ 50.000"
              />
            </div>
          </div>

          <!-- SI ES OBLIGATORIO: SELECTOR DE FECHA DE VIGENCIA -->
          <div v-if="config.seguroObligatorio" class="cobros-field mt-3">
            <label class="cobros-field__label">📅 Fecha de Inicio de Vigencia del Cobro Obligatorio</label>
            <input v-model="config.fechaVigenciaSeguro" type="date" class="cobros-input" style="max-width: 240px;" />
            <span class="small text-muted mt-1">Al guardar, si esta fecha es hoy o anterior, el cobro de seguro se aplicará a todos los deportistas activos.</span>
          </div>
        </div>
        </div>
      </section>

      <!-- ====== SECCIÓN 4: PRECIOS POR SEDE ====== -->
      <section class="cobros-section">
        <div class="cobros-section__header" @click="collapsedSections.preciosSede = !collapsedSections.preciosSede" style="cursor: pointer;">
          <span class="cobros-section__icon">🏢</span>
          <div style="flex: 1;">
            <h2 class="cobros-section__title">Precios por Sede</h2>
            <p class="cobros-section__desc">Define si todas las sedes comparten tarifa unificada o si cada una tiene sus propios precios.</p>
          </div>
          <div class="d-flex align-items-center gap-3">
            <label class="cobros-toggle" :class="{ 'cobros-toggle--on': config.preciosDiferenciados }" @click.stop>
              <input id="toggle-precios-diff" type="checkbox" v-model="config.preciosDiferenciados" class="cobros-toggle__input" />
              <span class="cobros-toggle__thumb"></span>
              <span class="cobros-toggle__label">{{ config.preciosDiferenciados ? 'Diferenciados' : 'Unificados' }}</span>
            </label>
            <span class="fs-4">{{ collapsedSections.preciosSede ? '➕' : '➖' }}</span>
          </div>
        </div>
        <div v-show="!collapsedSections.preciosSede">
        <div class="cobros-info-box">
          <span v-if="!config.preciosDiferenciados">
            🔗 Todas las sedes comparten las mismas tarifas globales.
          </span>
          <span v-else>
            ⚙️ Precios diferenciados activos: Puedes parametrizar la tarifa de cada sede directamente arriba en el esquema correspondiente.
          </span>
        </div>
        </div>
      </section>

      <!-- ====== SECCIÓN 5: ESCENARIOS ====== -->
      <section class="cobros-section">
        <div class="cobros-section__header" @click="collapsedSections.escenarios = !collapsedSections.escenarios" style="cursor: pointer;">
          <span class="cobros-section__icon">🏟️</span>
          <div style="flex: 1;">
            <h2 class="cobros-section__title">Escenarios</h2>
            <p class="cobros-section__desc">
              Los espacios donde tu club dicta las clases. Escribe el nombre que uses tú:
              "Cancha", "Pista" y "Gimnasio" en patinaje; "Sintética" o "Parque" en fútbol; o ninguno
              si no necesitas distinguirlos. Cada sede se enlaza a un escenario, y los planes indican
              cuántos días de cada uno incluyen.
            </p>
          </div>
          <div class="d-flex align-items-center gap-3">
            <button class="btn-add-solid" @click.stop="agregarEscenarioNuevo">➕ Nuevo escenario</button>
            <span class="fs-4">{{ collapsedSections.escenarios ? '➕' : '➖' }}</span>
          </div>
        </div>

        <div v-show="!collapsedSections.escenarios">
        <div v-if="escenarios.length === 0" class="cobros-info-box">
          Aún no has creado escenarios. Sin ellos no se controlan cupos de asistencia — útil si tu club
          usa un solo tipo de espacio.
        </div>

        <div v-for="(esc, idx) in escenarios" :key="esc.id ?? ('nuevo-esc-' + idx)" class="cobros-conditional-box mb-2">
          <div class="cobros-field-row">
            <div class="cobros-field">
              <label class="cobros-field__label">Nombre del escenario</label>
              <input v-model="esc.nombre" type="text" class="cobros-input" placeholder="ej. Pista" />
            </div>
            <div class="cobros-field">
              <label class="cobros-field__label">Emoji (opcional)</label>
              <input v-model="esc.emoji" type="text" class="cobros-input" maxlength="4" placeholder="🛼" />
            </div>
            <div class="cobros-field">
              <label class="cobros-field__label">La cuota se cuenta por</label>
              <select v-model="esc.periodo" class="cobros-select">
                <option value="SEMANAL">Semana</option>
                <option value="MENSUAL">Mes</option>
              </select>
            </div>
            <div class="cobros-field d-flex align-items-end gap-2">
              <button class="btn-delete-solid" @click="eliminarEscenario(esc)">🗑️</button>
            </div>
          </div>
          <p class="small mt-2 mb-0" style="color: var(--text-secondary);">
            En los planes se verá como <strong>{{ etiquetaEscenario(esc) || '—' }}</strong>
          </p>
        </div>
        </div>
      </section>

      <!-- ====== SECCIÓN 6: COMPLEMENTOS ====== -->
      <section class="cobros-section">
        <div class="cobros-section__header" @click="collapsedSections.complementos = !collapsedSections.complementos" style="cursor: pointer;">
          <span class="cobros-section__icon">🧩</span>
          <div style="flex: 1;">
            <h2 class="cobros-section__title">Complementos</h2>
            <p class="cobros-section__desc">
              Servicios opcionales adicionales a la mensualidad (Gym Virtual, Gym Presencial, Pista Adicional,
              Valor x Clase...). Cada complemento decide si su precio es único para todo el club o diferenciado por sede.
            </p>
          </div>
          <div class="d-flex align-items-center gap-3">
            <button class="btn-add-solid" @click.stop="agregarComplementoNuevo">➕ Nuevo complemento</button>
            <span class="fs-4">{{ collapsedSections.complementos ? '➕' : '➖' }}</span>
          </div>
        </div>

        <div v-show="!collapsedSections.complementos">
        <div v-if="complementos.length === 0" class="cobros-info-box">Aún no has creado complementos.</div>

        <div v-for="(comp, cIdx) in complementos" :key="comp.id ?? ('nuevo-comp-' + cIdx)" class="cobros-conditional-box mb-3">
          <div class="cobros-field-row">
            <div class="cobros-field">
              <label class="cobros-field__label">Nombre</label>
              <input v-model="comp.nombre" type="text" class="cobros-input" placeholder="ej. Gym Virtual" />
            </div>
            <div class="cobros-field">
              <label class="cobros-field__label">Sede donde se asiste (opcional)</label>
              <select v-model.number="comp.sedeId" class="cobros-select" @change="comp.grupoNombre = null">
                <option :value="null">— Ninguna (no controla asistencia) —</option>
                <option v-for="s in sedes" :key="s.id" :value="s.id">
                  {{ s.nombre }}
                </option>
              </select>
            </div>
            <div class="cobros-field">
              <label class="cobros-field__label">Grupo (opcional)</label>
              <select v-model="comp.grupoNombre" class="cobros-select" :disabled="!comp.sedeId">
                <option :value="null">{{ comp.sedeId ? '— Todos los grupos —' : 'Selecciona una sede primero' }}</option>
                <option v-for="g in gruposDeSede(comp.sedeId)" :key="g.nombre" :value="g.nombre">
                  {{ g.emoji ? g.emoji + ' ' : '' }}{{ g.nombre }}
                </option>
              </select>
            </div>
            <div class="cobros-field">
              <label class="cobros-field__label">
                Veces por {{ periodoDeComplementoSede(comp.sedeId) }} (vacío = sin tope)
              </label>
              <input v-model.number="comp.vecesPorPeriodo" type="number" min="1" class="cobros-input" />
              <span class="small" style="color: var(--text-secondary);">
                {{ comp.sedeId
                    ? 'El periodo lo define el escenario de la sede.'
                    : 'Elige una sede para controlar la cuota.' }}
              </span>
            </div>
          </div>

          <label class="cobros-toggle mt-2" :class="{ 'cobros-toggle--on': comp.preciosDiferenciadosPorSede }" style="margin-left: 0;">
            <input type="checkbox" v-model="comp.preciosDiferenciadosPorSede" class="cobros-toggle__input" />
            <span class="cobros-toggle__thumb"></span>
            <span class="cobros-toggle__label">{{ comp.preciosDiferenciadosPorSede ? 'Precio diferenciado por sede' : 'Precio único para todo el club' }}</span>
          </label>

          <div v-if="!comp.preciosDiferenciadosPorSede" class="cobros-field mt-2" style="max-width: 240px;">
            <label class="cobros-field__label">Precio ($)</label>
            <input
              :value="formatInputCurrency(comp.precioBase)"
              @input="comp.precioBase = parseCurrencyInput($event.target.value)"
              type="text"
              class="cobros-input"
              placeholder="$ 17.000"
            />
          </div>
          <div v-else class="sedes-pricing-list border rounded p-3 mt-2" style="background: var(--bg-secondary); border-color: var(--border-primary) !important;">
            <div v-for="sede in sedes" :key="sede.id" class="row g-2 align-items-center mb-1">
              <div class="col-md-5 small fw-semibold" style="color: var(--text-primary);">{{ sede.nombre }}</div>
              <div class="col-md-7">
                <input
                  :value="formatInputCurrency(comp.preciosPorSede[sede.id])"
                  @input="setComplementoSedePrecio(comp, sede.id, parseCurrencyInput($event.target.value))"
                  type="text"
                  class="cobros-input"
                  placeholder="$ 25.000"
                />
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-3">
            <button class="btn-delete-solid" @click="eliminarComplemento(comp)">🗑️ Desactivar</button>
          </div>
        </div>
        </div>
      </section>

      <!-- ====== BOTÓN GUARDAR ====== -->
      <div class="cobros-footer">
        <div v-if="hayCambiosSinGuardar && !guardando" class="cobros-info-box mb-2">
          ⚠️ Tienes cambios sin guardar en esta página.
        </div>
        <div v-if="error" class="cobros-alert cobros-alert--danger">{{ error }}</div>
        <button
          id="cobros-btn-guardar"
          class="cobros-btn-guardar"
          :disabled="guardando || !!calendarioError"
          @click="guardarTodo"
        >
          <span v-if="guardando" class="spinner-small"></span>
          {{ guardando ? 'Guardando...' : '💾 Guardar Configuración' }}
        </button>
        <div v-if="guardado" class="cobros-success-banner mt-2">
          ✅ Configuración guardada exitosamente
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import axios from 'axios'
import { usePlanesMensualidad } from '@/utils/usePlanesMensualidad'
import { useEscenarios } from '@/utils/useEscenarios'

const collapsedSections = ref({
  parametrosCobro: true,
  matricula: true,
  seguro: true,
  preciosSede: true,
  escenarios: true,
  complementos: true
})

const { planesPorSede, cargarTodosLosPlanes, crearPlanVacio, guardarPlan, eliminarPlan } = usePlanesMensualidad()
const { escenarios, cargarEscenarios, etiquetaEscenario, adjetivoPeriodo, escenarioPorId } = useEscenarios()

/** Solo los escenarios activos se muestran como columna en la tabla de planes. */
const escenariosActivos = computed(() => escenarios.value.filter(e => e.activo !== false && e.id != null))

const hayPlanesSinGuardar = computed(() =>
  Object.values(planesPorSede.value).some(lista => (lista || []).some(p => p.dirty))
)

const ETIQUETAS_ESQUEMA = { MENSUALIDAD: '📅 Mensualidad', PAQUETE: '📦 Paquetes de Clases', POR_CLASE: '⚡ Pago por Clase Asistida' }
const etiquetaEsquemaCobro = computed(() => ETIQUETAS_ESQUEMA[config.value.esquemaCobro] || config.value.esquemaCobro)

// ─── Detección de cambios sin guardar: foto del estado justo después de cargar
// (y de cada guardado exitoso), comparada contra el estado actual. Evita tener que
// marcar "dirty" campo por campo en las decenas de inputs de config/escenarios/
// complementos — los planes ya traen su propio flag `dirty` por fila, ese se respeta. ───
const snapshotConfig = ref('{}')
const snapshotEscenarios = ref('[]')
const snapshotComplementos = ref('[]')

function tomarSnapshot() {
  snapshotConfig.value = JSON.stringify({ config: config.value, tarifasSede: tarifasSede.value, paquetesList: paquetesList.value, preciosSedes: preciosSedes.value })
  snapshotEscenarios.value = JSON.stringify(escenarios.value)
  snapshotComplementos.value = JSON.stringify(complementos.value)
}

const hayConfigSinGuardar = computed(() =>
  JSON.stringify({ config: config.value, tarifasSede: tarifasSede.value, paquetesList: paquetesList.value, preciosSedes: preciosSedes.value }) !== snapshotConfig.value
)
const hayEscenariosSinGuardar = computed(() => JSON.stringify(escenarios.value) !== snapshotEscenarios.value)
const hayComplementosSinGuardar = computed(() => JSON.stringify(complementos.value) !== snapshotComplementos.value)
const hayCambiosSinGuardar = computed(() =>
  hayConfigSinGuardar.value || hayEscenariosSinGuardar.value || hayComplementosSinGuardar.value || hayPlanesSinGuardar.value
)

onBeforeRouteLeave((to, from, next) => {
  if (!hayCambiosSinGuardar.value) return next()
  next(window.confirm('Tienes cambios sin guardar en Ajustes de Cobro. ¿Deseas salir sin guardarlos?'))
})

function onBeforeUnload(e) {
  if (!hayCambiosSinGuardar.value) return
  e.preventDefault()
  e.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', onBeforeUnload))

/** Escribe la cantidad de un escenario en el plan; vacío = el plan no incluye ese escenario. */
function setCupo(plan, escenarioId, valor) {
  const n = parseInt(valor, 10)
  if (!valor || isNaN(n) || n <= 0) {
    delete plan.cupos[escenarioId]
  } else {
    plan.cupos[escenarioId] = n
  }
  plan.dirty = true
}

/** Recolecta todas las filas de planes editadas (en cualquier sede) pendientes de guardar. */
function planesPendientes() {
  const pendientes = []
  for (const [sedeId, lista] of Object.entries(planesPorSede.value)) {
    for (const plan of lista || []) {
      if (plan.dirty) pendientes.push({ sedeId: Number(sedeId), plan })
    }
  }
  return pendientes
}

async function onEliminarPlan(sedeId, plan) {
  if (plan.id && !confirm(`¿Eliminar el plan "${plan.nombre}"?`)) return
  try {
    await eliminarPlan(sedeId, plan)
  } catch (e) {
    alert('Error al eliminar el plan')
    console.error(e)
  }
}

// ─── Escenarios ───
function agregarEscenarioNuevo() {
  escenarios.value.push({ id: null, nombre: '', emoji: '', periodo: 'SEMANAL', activo: true })
}

/**
 * Guarda un escenario contra el backend. No valida ni recarga por su cuenta: lo
 * orquesta `guardarTodo()`, que valida todas las filas de una vez y recarga al final.
 */
async function guardarEscenario(esc) {
  const payload = {
    nombre: (esc.nombre || '').trim(),
    emoji: esc.emoji || null,
    periodo: esc.periodo || 'SEMANAL',
    activo: esc.activo !== false
  }
  if (esc.id) {
    await axios.put(`/api/escenarios/${esc.id}`, payload)
  } else {
    await axios.post('/api/escenarios', payload)
  }
}

// Eliminar sigue siendo una acción inmediata (no forma parte del guardado en lote):
// borrar algo no es un cambio que tenga sentido "dejar pendiente".
async function eliminarEscenario(esc) {
  if (!esc.id) {
    escenarios.value = escenarios.value.filter(e => e !== esc)
    return
  }
  if (!confirm(`¿Desactivar el escenario "${esc.nombre}"?`)) return
  try {
    await axios.delete(`/api/escenarios/${esc.id}`)
    await cargarEscenarios(true)
    tomarSnapshot()
  } catch (e) {
    alert(e.response?.data?.error || 'Error al desactivar el escenario')
    console.error(e)
  }
}

/** Palabra del periodo del escenario al que apunta un complemento ("semana"/"mes"). */
function periodoDeComplemento(comp) {
  const esc = comp.escenarioId ? escenarioPorId(comp.escenarioId) : null
  return esc?.periodo === 'MENSUAL' ? 'mes' : 'semana'
}

const cargando = ref(false)
const guardando = ref(false)
const guardado = ref(false)
const error = ref('')

const sedes = ref([])

const sedesParaPlanes = computed(() => {
  if (config.value.preciosDiferenciados) return sedes.value
  return [{ id: 'global', nombre: 'Planes Globales (aplican a todo el club)' }]
})
const preciosSedes = ref({})
// Tarifas de mensualidad por sede (Preferencial/Actual/Mora), keyed por sedeId.
const tarifasSede = ref({})
// Catálogo de complementos opcionales (Gym Virtual, Pista Adicional, etc.)
const complementos = ref([])

const paquetesList = ref([
  { nombre: 'Paquete 5 Clases', clases: 5, precio: 120000 },
  { nombre: 'Paquete 10 Clases', clases: 10, precio: 220000 }
])

const config = ref({
  esquemaCobro: 'MENSUALIDAD',
  montoPreferencial: 90000,
  diaLimitePreferencial: 5,
  montoEstandar: 100000,
  montoMora: 115000,
  diaCorteMora: 15,
  cobraMatricula: false,
  matriculaObligatoria: false,
  montoMatricula: null,
  regularidadMatricula: 'ANUAL',
  fechaVigenciaMatricula: '',
  cobraSeguro: false,
  seguroObligatorio: false,
  montoSeguro: null,
  regularidadSeguro: 'ANUAL',
  fechaVigenciaSeguro: '',
  precioClaseGrupal: 25000,
  precioClasePersonalizada: 60000,
  preciosDiferenciados: false
})

// El calendario de mensualidad depende de que ambos días estén dentro de 0-31
// y que la mora sea posterior al límite preferencial; de lo contrario el rango
// de "Tarifa Actual" queda negativo y rompe el cálculo de precios (MonthlyBillingService).
// 0 es un valor válido que significa "tarifa desactivada":
//   - Preferencial en 0 → el mes arranca directo en Tarifa Actual.
//   - Mora en 0 → nunca se cobra recargo, la Tarifa Actual rige todo el mes.
const DIA_MIN = 0
const DIA_MAX = 31

function clampDia(val) {
  const n = Number(val)
  if (!Number.isFinite(n) || val === '' || val === null) return null
  return Math.min(DIA_MAX, Math.max(DIA_MIN, Math.round(n)))
}

function onDiaLimitePreferencialInput(val) {
  config.value.diaLimitePreferencial = clampDia(val)
  ajustarDiaCorteMora()
}

function onDiaCorteMoraInput(val) {
  config.value.diaCorteMora = clampDia(val)
  ajustarDiaCorteMora()
}

// Si ambas tarifas están activas (>0) y la mora quedó igual o antes que el día
// límite preferencial, empuja la mora un día después para mantener un calendario válido.
function ajustarDiaCorteMora() {
  const pref = config.value.diaLimitePreferencial
  const mora = config.value.diaCorteMora
  if (pref > 0 && mora > 0 && mora <= pref) {
    config.value.diaCorteMora = Math.min(DIA_MAX, pref + 1)
  }
}

const calendarioError = computed(() => {
  if (config.value.esquemaCobro !== 'MENSUALIDAD') return ''
  const pref = config.value.diaLimitePreferencial
  const mora = config.value.diaCorteMora
  if (pref == null || mora == null) return 'Debes definir ambos días del calendario de tarifas (usa 0 para desactivar).'
  if (pref < DIA_MIN || pref > DIA_MAX || mora < DIA_MIN || mora > DIA_MAX) {
    return `Los días deben estar entre ${DIA_MIN} y ${DIA_MAX}.`
  }
  if (pref > 0 && mora > 0 && mora <= pref) {
    return 'El día de mora debe ser posterior al día límite de la tarifa preferencial.'
  }
  return ''
})

const preferencialActiva = computed(() => Number(config.value.diaLimitePreferencial) > 0)
const moraActiva = computed(() => Number(config.value.diaCorteMora) > 0)

const rangoActualInicio = computed(() => (preferencialActiva.value ? Number(config.value.diaLimitePreferencial) + 1 : 1))
const rangoActualFin = computed(() => (moraActiva.value ? Number(config.value.diaCorteMora) : 31))

const rangoMoraInicio = computed(() => {
  const dia = Number(config.value.diaCorteMora)
  return Number.isFinite(dia) && dia > 0 ? dia + 1 : '—'
})

onMounted(async () => {
  await Promise.all([cargarConfig(), cargarSedes(), cargarEscenarios(true), cargarComplementos()])
  await cargarTodosLosPlanes()
  tomarSnapshot()
})

async function cargarSedes() {
  try {
    const res = await axios.get('/api/sedes')
    sedes.value = res.data || []
  } catch (e) {
    console.error('Error al cargar sedes:', e)
  }
}

async function cargarComplementos() {
  try {
    const res = await axios.get('/api/complementos')
    complementos.value = (res.data || []).map(c => {
      // Derive a sedeId from escenarioId for the UI
      let inferredSedeId = null;
      if (c.escenario?.id) {
        const sedeMatch = sedes.value.find(s => s.escenario?.id === c.escenario.id && (c.grupoNombre ? s.grupos?.some(g => g.nombre === c.grupoNombre) : true));
        if (sedeMatch) inferredSedeId = sedeMatch.id;
      }
      return {
        ...c,
        sedeId: inferredSedeId,
        preciosPorSede: Object.fromEntries((c.preciosPorSede || []).map(p => [p.sedeOrigen.id, p.precio]))
      }
    })
  } catch (e) {
    console.error('Error al cargar complementos:', e)
  }
}

function gruposDeSede(sedeId) {
  if (!sedeId) return []
  const sede = sedes.value.find(s => s.id === sedeId)
  return sede?.grupos || []
}

function periodoDeComplementoSede(sedeId) {
  if (!sedeId) return 'semana'
  const sede = sedes.value.find(s => s.id === sedeId)
  return sede?.escenario?.periodo === 'MENSUAL' ? 'mes' : 'semana'
}

function agregarComplementoNuevo() {
  complementos.value.push({
    id: null,
    nombre: '',
    vecesPorPeriodo: null,
    sedeId: null,
    grupoNombre: null,
    preciosDiferenciadosPorSede: false,
    precioBase: null,
    preciosPorSede: {}
  })
}

function setComplementoSedePrecio(comp, sedeId, val) {
  if (!comp.preciosPorSede) comp.preciosPorSede = {}
  comp.preciosPorSede[sedeId] = val
}

/** Igual que guardarEscenario: sin validar ni recargar, eso lo hace `guardarTodo()`. */
async function guardarComplemento(comp) {
  // Derive escenarioId from selected sedeId
  const sedeObj = sedes.value.find(s => s.id === comp.sedeId);
  const derivedEscenarioId = sedeObj?.escenario?.id || null;

  const payload = {
    nombre: (comp.nombre || '').trim(),
    vecesPorPeriodo: comp.vecesPorPeriodo || null,
    escenarioId: derivedEscenarioId,
    grupoNombre: derivedEscenarioId ? (comp.grupoNombre || null) : null,
    preciosDiferenciadosPorSede: !!comp.preciosDiferenciadosPorSede,
    precioBase: comp.precioBase,
    preciosPorSede: sedes.value
      .map(s => ({ sedeId: s.id, precio: comp.preciosPorSede?.[s.id] }))
      .filter(p => p.precio != null)
  }
  if (comp.id) {
    await axios.put(`/api/complementos/${comp.id}`, payload)
  } else {
    await axios.post('/api/complementos', payload)
  }
}

// Eliminar sigue siendo inmediato, igual que en Escenarios.
async function eliminarComplemento(comp) {
  if (!comp.id) {
    complementos.value = complementos.value.filter(c => c !== comp)
    return
  }
  if (!confirm(`¿Desactivar el complemento "${comp.nombre}"?`)) return
  try {
    await axios.delete(`/api/complementos/${comp.id}`)
    await cargarComplementos()
    tomarSnapshot()
  } catch (e) {
    alert('Error al desactivar el complemento')
    console.error(e)
  }
}

async function cargarConfig() {
  cargando.value = true
  try {
    const res = await axios.get('/api/config/cobro')
    const d = res.data
    config.value = {
      esquemaCobro: d.esquemaCobro || 'MENSUALIDAD',
      montoPreferencial: d.montoPreferencial ?? 90000,
      diaLimitePreferencial: clampDia(d.diaLimitePreferencial ?? 5),
      montoEstandar: d.montoEstandar ?? 100000,
      montoMora: d.montoMora ?? 115000,
      diaCorteMora: clampDia(d.diaCorteMora ?? 15),
      cobraMatricula: d.cobraMatricula ?? false,
      matriculaObligatoria: d.matriculaObligatoria ?? false,
      montoMatricula: d.montoMatricula ?? null,
      regularidadMatricula: d.regularidadMatricula || 'ANUAL',
      fechaVigenciaMatricula: d.fechaVigenciaMatricula || '',
      cobraSeguro: d.cobraSeguro ?? false,
      seguroObligatorio: d.seguroObligatorio ?? false,
      montoSeguro: d.montoSeguro ?? null,
      regularidadSeguro: d.regularidadSeguro || 'ANUAL',
      fechaVigenciaSeguro: d.fechaVigenciaSeguro || '',
      precioClaseGrupal: d.precioClaseGrupal ?? 25000,
      precioClasePersonalizada: d.precioClasePersonalizada ?? 60000,
      preciosDiferenciados: d.preciosDiferenciados ?? false
    }
    ajustarDiaCorteMora()
    if (d.paquetesClasesJson) {
      try { paquetesList.value = JSON.parse(d.paquetesClasesJson) } catch (e) {}
    }
    if (d.preciosPorSedeJson) {
      try { preciosSedes.value = JSON.parse(d.preciosPorSedeJson) } catch (e) {}
    }
    tarifasSede.value = {}
    if (Array.isArray(d.tarifasSede)) {
      for (const t of d.tarifasSede) {
        if (t.sede && t.sede.id != null) {
          tarifasSede.value[t.sede.id] = {
            montoPreferencial: t.montoPreferencial,
            montoEstandar: t.montoEstandar,
            montoMora: t.montoMora
          }
        }
      }
    }
  } catch (e) {
    error.value = 'Error al cargar la configuración de cobro.'
  } finally {
    cargando.value = false
  }
}

function setPrecioSede(sedeId, key, val) {
  if (!preciosSedes.value[sedeId]) {
    preciosSedes.value[sedeId] = {}
  }
  preciosSedes.value[sedeId][key] = val
}

// En Mensualidad y Paquetes no se distingue Grupal/Personalizada (eso es exclusivo de Por
// Clase) — un solo campo en la UI escribe el mismo valor en ambas claves, para que el backend
// cobre correctamente sin importar el tipo de clase que se registre.
function setPrecioSedeClaseExtra(sedeId, val) {
  setPrecioSede(sedeId, 'grupal', val)
  setPrecioSede(sedeId, 'personalizada', val)
}

function setTarifaSede(sedeId, key, val) {
  if (!tarifasSede.value[sedeId]) {
    tarifasSede.value[sedeId] = {}
  }
  tarifasSede.value[sedeId][key] = val
}

/**
 * Guardado único de toda la página: config general (matrícula, seguro, calendario,
 * tarifa por defecto, paquetes), escenarios, complementos y planes con cambios
 * pendientes. Se valida todo primero, luego se guarda en paralelo, y al final se
 * recarga y se toma una nueva foto para limpiar el aviso de "cambios sin guardar".
 */
async function guardarTodo() {
  if (calendarioError.value) {
    error.value = calendarioError.value
    return
  }
  if (escenarios.value.some(e => !e.nombre || !e.nombre.trim())) {
    error.value = 'Hay escenarios sin nombre. Complétalos o elimínalos antes de guardar.'
    return
  }
  if (complementos.value.some(c => !c.nombre || !c.nombre.trim())) {
    error.value = 'Hay complementos sin nombre. Complétalos o elimínalos antes de guardar.'
    return
  }
  const pendientesPlanes = planesPendientes()
  if (pendientesPlanes.some(({ plan }) => !plan.nombre || !plan.nombre.trim())) {
    error.value = 'Hay planes sin nombre. Complétalos antes de guardar.'
    return
  }

  guardando.value = true
  guardado.value = false
  error.value = ''
  try {
    const configPayload = {
      ...config.value,
      paquetesClasesJson: JSON.stringify(paquetesList.value),
      preciosPorSedeJson: JSON.stringify(preciosSedes.value),
      tarifasSede: sedes.value.map(s => ({
        sedeId: s.id,
        montoPreferencial: tarifasSede.value[s.id]?.montoPreferencial ?? null,
        montoEstandar: tarifasSede.value[s.id]?.montoEstandar ?? null,
        montoMora: tarifasSede.value[s.id]?.montoMora ?? null
      }))
    }

    const tareas = [
      axios.put('/api/config/cobro', configPayload),
      ...escenarios.value.map(esc => guardarEscenario(esc)),
      ...complementos.value.map(comp => guardarComplemento(comp)),
      ...pendientesPlanes.map(({ sedeId, plan }) => guardarPlan(sedeId, plan))
    ]
    const resultados = await Promise.allSettled(tareas)
    const fallidos = resultados.filter(r => r.status === 'rejected')

    await Promise.all([cargarConfig(), cargarEscenarios(true), cargarComplementos(), cargarTodosLosPlanes()])
    tomarSnapshot()

    if (fallidos.length === 0) {
      guardado.value = true
    } else {
      console.error('Fallos al guardar:', fallidos)
      error.value = `Se guardó la mayoría, pero ${fallidos.length} elemento(s) fallaron. Revísalos e intenta de nuevo.`
    }
  } catch (e) {
    error.value = e.response?.data?.mensaje || e.response?.data?.error || 'Error al guardar la configuración.'
  } finally {
    guardando.value = false
  }
}

function setPaqueteSedePrecio(paq, sedeId, val) {
  if (!paq.preciosSedes) paq.preciosSedes = {}
  paq.preciosSedes[sedeId] = val
}

function agregarPaquete() {
  paquetesList.value.push({ nombre: 'Nuevo Paquete', clases: 10, precio: 200000, preciosSedes: {} })
}
function quitarPaquete(idx) {
  paquetesList.value.splice(idx, 1)
}

function formatInputCurrency(val) {
  if (val == null || val === '') return ''
  const num = typeof val === 'number' ? val : parseFloat(val)
  if (isNaN(num)) return ''
  return '$ ' + new Intl.NumberFormat('es-CO').format(num)
}

function parseCurrencyInput(text) {
  if (!text) return null
  const clean = text.replace(/[^0-9]/g, '')
  if (!clean) return null
  return parseInt(clean, 10)
}
</script>

<style scoped>
.cobros-view { padding: var(--space-6) 0; display: flex; flex-direction: column; gap: var(--space-6); max-width: 920px; margin: 0 auto; }
.cobros-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); }
.cobros-header__title { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
.cobros-header__subtitle { font-size: 0.9rem; color: var(--text-secondary); margin: 0; }
.cobros-success-banner { background: rgba(22, 163, 74, 0.15); color: #16a34a; border: 1px solid rgba(22, 163, 74, 0.3); font-weight: 600; padding: 8px 14px; border-radius: var(--radius-md); font-size: 0.88rem; }

.cobros-section { background: var(--card-bg); border: 1px solid var(--border-primary); border-radius: var(--radius-lg); padding: var(--space-5) var(--space-6); }
.cobros-section__header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
.cobros-section__icon { font-size: 1.6rem; }
.cobros-section__title { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin: 0; }
.cobros-section__desc { font-size: 0.85rem; color: var(--text-secondary); margin: 2px 0 0; }

.cobros-conditional-box { background: var(--bg-secondary); border: 1px dashed var(--border-primary); border-radius: var(--radius-md); padding: var(--space-4); }
.cobros-sub-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0 0 10px; }
.cobros-sub-config { display: flex; flex-direction: column; gap: var(--space-3); }
.cobros-field-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: var(--space-3); }
.cobros-field { display: flex; flex-direction: column; gap: 4px; }
.cobros-field__label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }

.cobros-input, .cobros-select { background: var(--input-bg); border: 1px solid var(--border-primary); border-radius: var(--radius-md); color: var(--text-primary); padding: 8px 12px; font-size: 0.9rem; width: 100%; }

.cobros-tarifa-timeline { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3); }
.cobros-tarifa-card { display: flex; flex-direction: column; gap: 4px; background: var(--card-bg); border: 1px solid var(--border-primary); border-radius: var(--radius-md); padding: 12px; border-top-width: 3px; }
.cobros-tarifa-card--preferencial { border-top-color: #16a34a; }
.cobros-tarifa-card--actual { border-top-color: #2563eb; }
.cobros-tarifa-card--mora { border-top-color: #dc2626; }
.cobros-tarifa-card__badge { align-self: flex-start; font-size: 0.72rem; font-weight: 700; color: var(--text-secondary); background: var(--bg-tertiary); padding: 2px 8px; border-radius: 999px; margin-bottom: 4px; }
.cobros-tarifa-card__hint { font-size: 0.72rem; color: var(--text-secondary); }
.cobros-tarifa-card--disabled { opacity: 0.55; }
.cobros-tarifa-card--disabled .cobros-input { cursor: not-allowed; }

.sede-tarifa-block { padding: 12px 0; border-top: 1px solid var(--border-primary); }
.sede-tarifa-block:first-of-type { border-top: none; padding-top: 0; }
.sede-tarifa-block__name { font-weight: 600; font-size: 0.88rem; color: var(--text-primary); margin-bottom: 8px; }

/* ─── Tabla comparativa de planes ───
   En escritorio es una tabla para poder comparar precios entre sedes de un vistazo;
   por debajo de 768px cada fila se apila como tarjeta (se oculta el thead y cada celda
   muestra su etiqueta con ::before), conservando la legibilidad en móvil sin JS. */
.sede-planes-bloque { padding: 12px 0; border-top: 1px solid var(--border-primary); }
.sede-planes-bloque:first-of-type { border-top: none; padding-top: 0; }

.badge-escenario {
  display: inline-block; margin-left: 6px; padding: 1px 8px; border-radius: 999px;
  background: var(--bg-tertiary); color: var(--text-secondary);
  font-size: 0.72rem; font-weight: 600; vertical-align: middle;
}

.tabla-planes-scroll { overflow-x: auto; }
.tabla-planes { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.tabla-planes th {
  text-align: left; padding: 6px 8px; font-weight: 600; font-size: 0.76rem;
  color: var(--text-secondary); border-bottom: 1px solid var(--border-primary);
  white-space: nowrap;
}
.tabla-planes td { padding: 4px 6px; border-bottom: 1px solid var(--border-primary); }
.tabla-planes .col-nombre { min-width: 140px; }
.tabla-planes .col-num { width: 110px; }
.tabla-planes .col-money { width: 130px; }
.tabla-planes .col-acciones { width: 44px; }
.tabla-planes tr.fila-sucia td { background: rgba(249, 115, 22, 0.07); }

.celda-input {
  width: 100%; background: var(--input-bg); border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm); color: var(--text-primary);
  padding: 5px 8px; font-size: 0.85rem;
}
.celda-input--num { text-align: center; }
.celda-input:focus { outline: 2px solid var(--orange-500); outline-offset: -1px; }

@media (max-width: 767px) {
  .tabla-planes thead { display: none; }
  .tabla-planes, .tabla-planes tbody, .tabla-planes tr, .tabla-planes td { display: block; width: 100%; }
  .tabla-planes tr {
    border: 1px solid var(--border-primary); border-radius: var(--radius-md);
    padding: 8px; margin-bottom: 10px; background: var(--card-bg);
  }
  .tabla-planes td { border-bottom: none; display: flex; align-items: center; gap: 8px; padding: 3px 0; }
  .tabla-planes td::before {
    content: attr(data-label); flex: 0 0 44%;
    font-size: 0.76rem; font-weight: 600; color: var(--text-secondary);
  }
  .tabla-planes .celda-input--num { text-align: left; }
}
.cobros-tarifa-timeline--compact { gap: var(--space-2, 8px); }
.cobros-tarifa-timeline--compact .cobros-tarifa-card { padding: 8px 10px; }
.cobros-calendario-error { margin: 10px 0 0; font-size: 0.82rem; font-weight: 600; color: #dc2626; }

.paquetes-grid { display: flex; flex-direction: column; gap: 10px; }
.paquete-card { display: flex; align-items: flex-end; gap: 10px; background: var(--card-bg); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-secondary); }

/* UI Fix: Botón Eliminar Rojo Sólido (#dc2626) y Botón Agregar Verde Sólido (#16a34a) */
.btn-delete-solid {
  background: #dc2626 !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: var(--radius-md) !important;
  padding: 8px 14px !important;
  font-size: 0.9rem !important;
  font-weight: 700 !important;
  cursor: pointer;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn-delete-solid:hover { background: #b91c1c !important; }

.btn-add-solid {
  background: #16a34a !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: var(--radius-md) !important;
  padding: 10px 18px !important;
  font-size: 0.88rem !important;
  font-weight: 700 !important;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
}
.btn-add-solid:hover { background: #15803d !important; }

.cobros-toggle { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; margin-left: auto; }
.cobros-toggle__input { display: none; }
.cobros-toggle__thumb { width: 36px; height: 20px; background: var(--border-primary); border-radius: 999px; position: relative; transition: background 0.2s ease; }
.cobros-toggle__thumb::after { content: ''; width: 16px; height: 16px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: transform 0.2s ease; }
.cobros-toggle--on .cobros-toggle__thumb { background: var(--orange-500); }
.cobros-toggle--on .cobros-toggle__thumb::after { transform: translateX(16px); }
.cobros-toggle__label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }

.cobros-info-box { background: var(--bg-tertiary); padding: 10px 14px; border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text-secondary); border-left: 3px solid var(--orange-500); }
.cobros-footer { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.cobros-btn-guardar { background: var(--orange-500); color: #fff; font-weight: 600; padding: 10px 22px; border-radius: var(--radius-md); border: none; cursor: pointer; font-size: 0.9rem; transition: all 0.2s ease; }
.cobros-btn-guardar:hover { background: #ea580c; }
.cobros-success-banner { background: rgba(22, 163, 74, 0.12) !important; border: 1px solid rgba(22, 163, 74, 0.3) !important; color: #16a34a !important; font-size: 0.85rem !important; font-weight: 600 !important; padding: 8px 14px !important; border-radius: var(--radius-md) !important; box-shadow: none !important; display: inline-flex; align-items: center; gap: 6px; }
.cobros-alert--danger { color: #dc2626; font-size: 0.85rem; }
.cobros-loading { text-align: center; padding: 50px; color: var(--text-secondary); }
</style>
