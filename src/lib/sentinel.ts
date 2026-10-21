export const SENTINEL_SCHEMA = 'whitehatledger369.sentinel.v1' as const

export interface Advisory {
  id: string
}

export interface SentinelPackage {
  name: string
  section: string
  declared: string
  version: string | null
  status: 'matched' | 'none_reported' | 'unknown'
  advisories: Advisory[]
  note?: string
}

export interface SentinelReport {
  schema: typeof SENTINEL_SCHEMA
  subject: string
  source: {
    path: string
    sha256: string | null
    git_commit: string | null
    scope: string
  }
  provider: {
    name: string
    endpoint: string
    status: 'complete' | 'unknown' | 'not_queried'
    note: string
  }
  generated_at: string | null
  summary: {
    direct_declared: number
    exact_versions_queried: number
    matched: number
    none_reported: number
    unknown: number
  }
  packages: SentinelPackage[]
  disclaimer: string
}

function isObj(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function isSentinelReport(value: unknown): value is SentinelReport {
  if (!isObj(value) || value.schema !== SENTINEL_SCHEMA ||
      value.subject !== 'MichaelWave369/WhiteHatLedger369' ||
      !isObj(value.source) || !isObj(value.provider) || !isObj(value.summary) ||
      !Array.isArray(value.packages)) return false

  const { source, provider, summary, packages } = value
  if (source.path !== 'package.json' ||
      (source.sha256 !== null && !(typeof source.sha256 === 'string' && /^[a-f0-9]{64}$/.test(source.sha256))) ||
      (source.git_commit !== null && !(typeof source.git_commit === 'string' && /^[a-f0-9]{40}$/.test(source.git_commit))) ||
      typeof source.scope !== 'string') return false

  if (provider.name !== 'OSV.dev' || provider.endpoint !== 'https://api.osv.dev/v1/querybatch' ||
      !['complete', 'unknown', 'not_queried'].includes(String(provider.status)) ||
      typeof provider.note !== 'string') return false

  if (value.generated_at !== null && (typeof value.generated_at !== 'string' || !Number.isFinite(Date.parse(value.generated_at)))) return false
  if (typeof value.disclaimer !== 'string') return false
  for (const key of ['direct_declared', 'exact_versions_queried', 'matched', 'none_reported', 'unknown']) {
    const count = summary[key]
    if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) return false
  }
  if (summary.direct_declared !== packages.length) return false

  for (const item of packages) {
    if (!isObj(item) || typeof item.name !== 'string' || !item.name ||
        typeof item.section !== 'string' || typeof item.declared !== 'string' ||
        (item.version !== null && typeof item.version !== 'string') ||
        !['matched', 'none_reported', 'unknown'].includes(String(item.status)) ||
        !Array.isArray(item.advisories) ||
        item.advisories.some((a: unknown) => !isObj(a) || typeof a.id !== 'string' || !/^[A-Za-z0-9_-]{3,128}$/.test(a.id))) return false
  }
  const counted = {
    matched: packages.filter((p) => p.status === 'matched').length,
    none_reported: packages.filter((p) => p.status === 'none_reported').length,
    unknown: packages.filter((p) => p.status === 'unknown').length,
  }
  return summary.matched === counted.matched &&
    summary.none_reported === counted.none_reported &&
    summary.unknown === counted.unknown &&
    counted.matched + counted.none_reported + counted.unknown === summary.direct_declared
}

export async function fetchSentinelReport(signal: AbortSignal): Promise<SentinelReport> {
  const url = new URL(`${import.meta.env.BASE_URL}sentinel-report.json`, window.location.origin)
  const response = await fetch(url, { signal, credentials: 'omit', cache: 'no-store' })
  if (!response.ok) throw new Error('Sentinel report unavailable.')
  const payload: unknown = await response.json()
  if (!isSentinelReport(payload)) throw new Error('Sentinel report failed schema validation.')
  return payload
}

export function isStale(report: SentinelReport, now = Date.now()): boolean {
  if (!report.generated_at) return true
  return now - Date.parse(report.generated_at) > 48 * 60 * 60 * 1000
}
