import { createVueMfe } from '@bank/ui'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

export const { bootstrap, mount, unmount } = createVueMfe('transactions', App, (app) => {
  app.use(
    createRouter({
      history: createWebHistory(),
      routes: [{ path: '/:rest(.*)*', component: { render: () => null } }],
    }),
  )
})
