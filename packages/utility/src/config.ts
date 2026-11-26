export interface BankConfig {
  sentryDsn?: string
  rum?: {
    applicationId: string
    identityPoolId: string
    guestRoleArn: string
    region: string
  }
}

let current: BankConfig = {}

/** Reads /config.json (generated at deploy time). Missing or invalid config means "no monitoring". */
export async function loadConfig(): Promise<BankConfig> {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' })
    if (res.ok) current = (await res.json()) as BankConfig
  } catch {
    current = {}
  }
  return current
}

export const getConfig = () => current
