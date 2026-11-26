import type { AppProps } from 'single-spa'

const container = (props: AppProps) =>
  document.getElementById(`single-spa-application:${props.name}`)!

/** Strangler-fig parcel: wraps the legacy JSP page (Tomcat, behind /legacy) in an iframe. */
export const legacyStatements = {
  async bootstrap() {},
  async mount(props: AppProps) {
    const el = container(props)
    const note = document.createElement('p')
    note.className = 'legacy-note'
    note.textContent = 'Legacy statements (JSP): flag statements.v2 is off'
    const frame = document.createElement('iframe')
    frame.className = 'legacy-frame'
    frame.title = 'Legacy statements'
    frame.src = `/legacy/statements${window.location.search}`
    el.append(note, frame)
  },
  async unmount(props: AppProps) {
    container(props).replaceChildren()
  },
}
