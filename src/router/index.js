import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ClientesView from '../views/ClientesView.vue'
import RegistroView from '../views/RegistroView.vue'
import CajaView from '@/views/CajaView.vue'
import HistorialAsistenciasView from '@/views/HistorialAsistenciasView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/clientes',
      name: 'clientes',
      component: ClientesView
    },
    {
      path: '/registro',
      name: 'registro',
      component: RegistroView
    },
    {
      path: '/caja',
      name: 'caja',
      component: CajaView
    },
    {
      path: '/historial-asistencias',
      name: 'historial-asistencias',
      component: HistorialAsistenciasView
    }
  ],
})

export default router
