import { createRouter, createWebHistory } from 'vue-router'
import LuckyDraw from '@/components/LuckyDraw/LuckyDraw.vue'
import SpecDraw from '@/components/SpecDraw/SpecDraw.vue'

const routes = [
  {
    path: '/',
    name: 'LuckyDraw',
    component: LuckyDraw
  },
  {
    path: '/spec-draw',
    name: 'SpecDraw',
    component: SpecDraw
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 