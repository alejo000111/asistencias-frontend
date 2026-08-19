<template>
  <div class="container">
    <div class="row justify-content-center align-items-center" style="min-height: 80vh;">
      <div class="col-md-6 col-lg-5">
        <div class="not-found-card text-center">
          <div class="not-found-card__emoji">🧭</div>
          <div class="not-found-card__code">404</div>
          <h4 class="not-found-card__title">Página no encontrada</h4>
          <p class="not-found-card__text">
            La dirección a la que intentaste acceder no existe o fue movida.
          </p>
          <router-link :to="{ name: 'home' }" class="not-found-card__btn">
            ⬅ Volver al inicio
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Vista mostrada a usuarios AUTENTICADOS que navegan a una ruta desconocida
// (ver router/index.js: la ruta catch-all '/:pathMatch(.*)*' renderiza este
// componente en vez de rebotar silenciosamente a 'home' como antes).
</script>

<style scoped>
.not-found-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: var(--space-10) var(--space-6);
}

.not-found-card__emoji {
  font-size: 2.5rem;
  margin-bottom: var(--space-2);
}

.not-found-card__code {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1;
  color: var(--orange-500);
  margin-bottom: var(--space-3);
}

.not-found-card__title {
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.not-found-card__text {
  color: var(--text-secondary);
  font-size: 0.9375rem;
  margin-bottom: var(--space-6);
}

.not-found-card__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  background: var(--orange-500);
  color: var(--color-white);
  border: 1px solid var(--orange-500);
  border-radius: var(--radius-md);
  padding: 12px 24px;
  font-weight: 600;
  font-size: 0.9375rem;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.not-found-card__btn:hover {
  background: var(--orange-600);
  border-color: var(--orange-600);
  color: var(--color-white);
  box-shadow: var(--shadow-md);
}
</style>
