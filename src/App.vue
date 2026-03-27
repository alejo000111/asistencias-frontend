<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
    <div class="container">
      <span class="navbar-brand mb-0 h1 fw-bold text-warning" style="letter-spacing: 1px;">Programa Asistencias</span>
      <div class="navbar-nav">
        <RouterLink class="nav-link" to="/">📝 Asistencia</RouterLink>
        <RouterLink class="nav-link" to="/historial-asistencias">📅 Historial Asistencias</RouterLink>
        <RouterLink class="nav-link" to="/clientes">👥 Clientes y Pagos</RouterLink>
        <RouterLink class="nav-link" to="/registro">➕ Inscripciones</RouterLink>
        <RouterLink class="nav-link" to="/caja">📊 Caja</RouterLink>
      </div>
    </div>
  </nav>

  <div class="container">
    <RouterView />
  </div>
  </template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<style>
/*Color en el fondo*/
body {
  background-color: #f8f9fa;
}
</style>