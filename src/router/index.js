import { createRouter, createWebHistory } from 'vue-router'
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
    meta: { requiresAuth: true }
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
    meta: { requiresAuth: true }
  },
  {
    path: '/gestion-empleados',
    name: 'gestion-empleados',
    component: () => import('../views/GestionEmpleadosView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// --- Guard de navegación: proteger rutas ---
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('authToken');

  // Rutas públicas (login y portal de padres)
  if (to.meta.public) {
    return next();
  }

  // Rutas protegidas: redirigir a login si no hay token
  if (!token) {
    // Limpiar cualquier residuo de sesión anterior
    localStorage.clear();
    return next({ name: 'login' });
  }

  next();
});

export default router
