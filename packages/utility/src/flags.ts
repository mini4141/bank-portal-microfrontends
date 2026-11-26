import { api } from './api'

export type Flags = Record<string, boolean>

/** Feature flags come from the BFF, which reads AWS AppConfig (cloud) or a local JSON file. */
export const fetchFlags = () => api<Flags>('/flags')
