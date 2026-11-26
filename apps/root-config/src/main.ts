import { registerApplication, start } from 'single-spa'
import { constructApplications, constructLayoutEngine, constructRoutes } from 'single-spa-layout'
import { legacyStatements } from './legacy-parcel'
import './styles.scss'

type Utility = typeof import('@bank/utility')
declare const System: { import: <T = unknown>(name: string) => Promise<T> }

const LEGACY = '@bank/legacy-statements'

async function boot() {
  const utility = await System.import<Utility>('@bank/utility')
  await utility.initAnalytics(await utility.loadConfig()).catch(console.error)

  const [user, flags] = await Promise.all([
    utility.fetchMe(),
    utility.fetchFlags().catch(() => ({}) as Record<string, boolean>),
  ])
  if (!user && !window.location.pathname.startsWith('/login')) {
    window.history.replaceState(null, '', '/login')
  }

  // Strangler-fig switch: the AppConfig flag decides which implementation serves /statements.
  const statementsApp = flags['statements.v2'] ? '@bank/statements' : LEGACY

  const routes = constructRoutes({
    containerEl: '#app',
    redirects: { '/': '/accounts' },
    routes: [
      { type: 'application', name: '@bank/navbar' },
      {
        type: 'route',
        path: 'accounts',
        routes: [{ type: 'application', name: '@bank/accounts' }],
      },
      {
        type: 'route',
        path: 'transactions',
        routes: [{ type: 'application', name: '@bank/transactions' }],
      },
      {
        type: 'route',
        path: 'transfer',
        routes: [{ type: 'application', name: '@bank/transfer' }],
      },
      { type: 'route', path: 'statements', routes: [{ type: 'application', name: statementsApp }] },
    ],
  })
  const applications = constructApplications({
    routes,
    loadApp: ({ name }) =>
      name === LEGACY ? Promise.resolve(legacyStatements) : System.import(name),
  })
  constructLayoutEngine({ routes, applications })
  applications.forEach(registerApplication)

  window.addEventListener('single-spa:routing-event', () =>
    utility.trackPageView(window.location.pathname),
  )
  utility.onAuthChange((u) => {
    if (!u) utility.navigate('/login')
  })
  start({ urlRerouteOnly: true })
}

boot().catch((err) => {
  document.body.insertAdjacentHTML('beforeend', '<p role="alert">The portal failed to start.</p>')
  console.error(err)
})
