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
    path: '/nomina',
    name: 'nomina',
    component: () => import('../views/NominaView.vue'),
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
    path: '/esquema-cobro',
    name: 'esquema-cobro',
    component: () => import('../views/EsquemaCobroView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/configuracion',
    name: 'configuracion',
    component: () => import('../views/ConfiguracionView.vue'),
    // No requiresAdmin: la pestaña "Seguridad y Contraseña" es de cualquier usuario autenticado.
    // La pestaña "Configuración General" (solo ADMIN/SUPERADMIN) se oculta dentro del propio componente.
    meta: { requiresAuth: true }
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
  const esSuperAdminUser = isSuperAdmin();

  // 1. Si es SuperAdmin y navega a la raíz '/', login o rutas operativas, redirigir a '/superadmin'
  if (autenticado && esSuperAdminUser && (to.path === '/' || to.name === 'login' || to.name === 'home')) {
    return { name: 'superadmin' };
  }

  // 2. Rutas públicas (login y portal de padres)
  if (to.meta.public) {
    if (autenticado && to.name === 'login') {
      return esSuperAdminUser ? { name: 'superadmin' } : { name: 'home' };
    }
    return true;
  }

  // 3. Rutas protegidas: redirigir inmediatamente a login si no hay token válido
  if (!autenticado) {
    clearSession();
    return { name: 'login' };
  }

  // 4. Rutas exclusivas de ADMIN (caja, sedes, empleados, ajustes cobros)
  if (to.meta.requiresAdmin && !esAdminUser && !esSuperAdminUser) {
    return { name: 'home' };
  }

  // 5. Rutas exclusivas de SUPERADMIN
  if (to.meta.requiresSuperAdmin && !esSuperAdminUser) {
    return { name: 'home' };
  }

  return true;
});

export default router
