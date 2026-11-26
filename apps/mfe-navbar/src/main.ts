import { createVueMfe } from '@bank/ui'
import App from './App.vue'

export const { bootstrap, mount, unmount } = createVueMfe('navbar', App)
