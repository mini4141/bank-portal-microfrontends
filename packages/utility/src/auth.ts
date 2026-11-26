import { api, ApiError } from './api'

export interface User {
  id: string
  username: string
  name: string
  nameJa: string
}

const EVENT = 'bank:auth'
let user: User | null = null

const emit = () => window.dispatchEvent(new CustomEvent(EVENT, { detail: user }))

export const getUser = () => user

export async function fetchMe(): Promise<User | null> {
  try {
    user = await api<User>('/me')
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 401) throw e
    user = null
  }
  emit()
  return user
}

export async function login(username: string, password: string): Promise<User> {
  user = await api<User>('/session', { method: 'POST', body: { username, password } })
  emit()
  return user
}

export async function logout(): Promise<void> {
  await api('/session', { method: 'DELETE' })
  user = null
  emit()
}

export function onAuthChange(cb: (u: User | null) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<User | null>).detail)
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
