import type { BankConfig } from './config'

interface Adapter {
  event(name: string, props: Record<string, unknown>): void
  pageView(path: string): void
}

const consoleAdapter: Adapter = {
  event: (name, props) => console.info(`[analytics] event ${name} ${JSON.stringify(props)}`),
  pageView: (path) => console.info(`[analytics] page_view ${path}`),
}

function rumAdapter(
  AwsRum: typeof import('aws-rum-web').AwsRum,
  rum: NonNullable<BankConfig['rum']>,
): Adapter {
  const client = new AwsRum(rum.applicationId, '1.0.0', rum.region, {
    sessionSampleRate: 1,
    identityPoolId: rum.identityPoolId,
    guestRoleArn: rum.guestRoleArn,
    telemetries: ['errors', 'performance', 'http'],
    allowCookies: true,
    disableAutoPageView: true,
  })
  return {
    event: (name, props) => client.recordEvent(name, props),
    pageView: (path) => client.recordPageView(path),
  }
}

let adapter: Adapter = consoleAdapter

/** CloudWatch RUM when configured (cloud), console adapter otherwise (local, tests). */
export async function initAnalytics(config: BankConfig): Promise<void> {
  if (!config.rum) return
  const { AwsRum } = await import('aws-rum-web') // lazy chunk: only loaded when RUM is configured
  adapter = rumAdapter(AwsRum, config.rum)
}

export const track = (name: string, props: Record<string, unknown> = {}) =>
  adapter.event(name, props)
export const trackPageView = (path: string) => adapter.pageView(path)
