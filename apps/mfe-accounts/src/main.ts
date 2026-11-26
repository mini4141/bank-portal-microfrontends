import { createVueMfe } from '@bank/ui'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import AccountList from './AccountList.vue'
import AccountDetail from './AccountDetail.vue'

export const { bootstrap, mount, unmount } = createVueMfe('accounts', App, (app) => {
  app.use(
    createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/accounts', component: AccountList },
        { path: '/accounts/:id', component: AccountDetail, props: true },
        { path: '/:rest(.*)*', component: { render: () => null } },
      ],
    }),
  )
})
