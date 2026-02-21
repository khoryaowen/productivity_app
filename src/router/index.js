import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NormalTimerView from '../views/NormalTimerView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import PomodoroTimerView from '../views/PomodoroTimerView.vue'

const routes = [
  { path: '/',           name: 'Home',     component: HomeView },
  { path: '/timer',      name: 'Timer',    component: NormalTimerView },
  { path: '/pomodoro',   name: 'Pomodoro', component: PomodoroTimerView },
  { path: '/analytics',  name: 'Analytics',component: AnalyticsView },
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
