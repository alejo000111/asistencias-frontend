import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, isAdmin, isSuperAdmin, clearSession } from '@/utils/auth'
import HomeView from '@/views/HomeView.vue'
import ClientesView from '../views/ClientesView.vue'
import RegistroView from '../views/RegistroView.vue'
import CajaView from '@/views/CajaView.vue'
import HistorialAsistenciasView from '@/views/HistorialAsistenciasView.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/clientes',
    name: 'clientes',
    component: ClientesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/registro',
    name: 'registro',
    component: RegistroView,
    meta: { requiresAuth: true }
  },
  {
    path: '/caja',
    name: 'caja',
    component: CajaView,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/historial-asistencias',
    name: 'historial-asistencias',
    component: HistorialAsistenciasView,
    meta: { requiresAuth: true }
  },
  {
    path: '/portal/:token',
    name: 'portal-padre',
    component: () => import('../views/PortalPadreView.vue'),
    meta: { public: true }
  },
  {
    path: '/gestion-sedes',
    name: 'gestion-sedes',
    component: () => import('../views/GestionSedesView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/gestion-empleados',
    name: 'gestion-empleados',
    component: () => import('../views/GestionEmpleadosView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/superadmin',
    name: 'superadmin',
    component: () => import('../views/SuperAdminView.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true }
  },
  {
    path: '/ajustes-cobros',
    name: 'ajustes-cobros',
    component: () => import('../views/AjustesCobrosView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: () => {
      return isAuthenticated() ? { name: 'home' } : { name: 'login' };
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// --- Guard de navegación: proteger rutas (Sintaxis moderna Vue Router 4) ---
router.beforeEach((to) => {
  const autenticado = isAuthenticated();
  const esAdminUser = isAdmin();

  // 1. Rutas públicas (login y portal de padres)
  if (to.meta.public) {
    if (autenticado && to.name === 'login') {
      return { name: 'home' };
    }
    return true;
  }

  // 2. Rutas protegidas: redirigir inmediatamente a login si no hay token válido
  if (!autenticado) {
    clearSession();
    return { name: 'login' };
  }

  // 3. Rutas exclusivas de ADMIN (caja, sedes, empleados, ajustes cobros)
  if (to.meta.requiresAdmin && !esAdminUser) {
    return { name: 'home' };
  }

  // 4. Rutas exclusivas de SUPERADMIN
  if (to.meta.requiresSuperAdmin && !isSuperAdmin()) {
    return { name: 'home' };
  }

  return true;
});

export default router
