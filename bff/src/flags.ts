import {
  AppConfigDataClient,
  GetLatestConfigurationCommand,
  StartConfigurationSessionCommand,
} from '@aws-sdk/client-appconfigdata'
import defaults from '../data/flags.json'

type FlagDoc = typeof defaults
const local: FlagDoc = structuredClone(defaults)

const { APPCONFIG_APPLICATION, APPCONFIG_ENVIRONMENT, APPCONFIG_PROFILE } = process.env
const useAppConfig = Boolean(APPCONFIG_APPLICATION && APPCONFIG_ENVIRONMENT && APPCONFIG_PROFILE)

let client: AppConfigDataClient | undefined
let token: string | undefined
let cached: FlagDoc | undefined

async function fromAppConfig(): Promise<FlagDoc> {
  client ??= new AppConfigDataClient({})
  if (!token) {
    const s = await client.send(
      new StartConfigurationSessionCommand({
        ApplicationIdentifier: APPCONFIG_APPLICATION,
        EnvironmentIdentifier: APPCONFIG_ENVIRONMENT,
        ConfigurationProfileIdentifier: APPCONFIG_PROFILE,
        RequiredMinimumPollIntervalInSeconds: 15,
      }),
    )
    token = s.InitialConfigurationToken
  }
  const r = await client.send(new GetLatestConfigurationCommand({ ConfigurationToken: token }))
  token = r.NextPollConfigurationToken
  if (r.Configuration && r.Configuration.length > 0) {
    cached = JSON.parse(Buffer.from(r.Configuration).toString('utf8'))
  }
  return cached ?? local
}

/** Returns { "statements.v2": true, ... } from AppConfig (cloud) or the local JSON (dev). */
export async function getFlags(): Promise<Record<string, boolean>> {
  let doc: FlagDoc
  try {
    doc = useAppConfig ? await fromAppConfig() : local
  } catch {
    token = undefined
    doc = cached ?? local
  }
  return Object.fromEntries(
    Object.entries(doc.values).map(([k, v]) => [k, Boolean((v as { enabled: boolean }).enabled)]),
  )
}

export function setLocalFlag(name: string, enabled: boolean): boolean {
  if (useAppConfig || !(name in local.values)) return false
  ;(local.values as Record<string, { enabled: boolean }>)[name].enabled = enabled
  return true
}
