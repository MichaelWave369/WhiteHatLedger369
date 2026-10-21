import { createHash } from 'node:crypto'

export const REPORT_SCHEMA = 'whitehatledger369.sentinel.v1'
export const OSV_ENDPOINT = 'https://api.osv.dev/v1/querybatch'
const MAX_PACKAGES = 250
const MAX_RESPONSE_PAGES = 8
const EXACT_NPM_VERSION = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

export function extractDirectDependencies(packageText) {
  const manifest = JSON.parse(packageText)
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('A package.json object is required')
  }
  const sections = ['dependencies', 'devDependencies', 'optionalDependencies']
  const dependencies = []
  const seen = new Set()
  for (const section of sections) {
    const values = manifest[section] ?? {}
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
      throw new Error(`Invalid ${section} in package.json`)
    }
    for (const [name, declared] of Object.entries(values)) {
      if (!name || typeof declared !== 'string') {
        throw new Error('Invalid npm dependency entry')
      }
      // Repeated names in multiple sections represent one declared direct dependency.
      if (seen.has(name)) continue
      seen.add(name)
      const version = EXACT_NPM_VERSION.test(declared) ? declared : null
      dependencies.push({
        name,
        section,
        declared,
        version,
        status: 'unknown',
        advisories: [],
        ...(version ? {} : { note: 'Declared spec is not an exact version; installed version unknown.' }),
      })
    }
  }
  if (dependencies.length > MAX_PACKAGES) {
    throw new Error('Direct dependency count exceeded explicit R1 limit')
  }
  return dependencies.sort((a, b) => a.name.localeCompare(b.name))
}

async function osvBatch(queries, fetcher) {
  const response = await fetcher(OSV_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ queries }),
    signal: AbortSignal.timeout(20_000),
    redirect: 'error',
  })
  if (!response?.ok) {
    throw new Error('OSV HTTP request was not successful')
  }
  const payload = await response.json()
  if (!payload || !Array.isArray(payload.results) || payload.results.length !== queries.length) {
    throw new Error('OSV returned incomplete or malformed batch results')
  }
  return payload.results.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error('Malformed OSV package response')
    }
    if (entry.vulns !== undefined && !Array.isArray(entry.vulns)) {
      throw new Error('Malformed OSV vulnerability list')
    }
    const advisories = (entry.vulns ?? []).map((v) => {
      if (!v || typeof v.id !== 'string' || !/^[A-Za-z0-9_-]{3,128}$/.test(v.id)) {
        throw new Error('Malformed OSV vulnerability ID')
      }
      return { id: v.id }
    })
    const pageToken = entry.next_page_token
    if (pageToken !== undefined && (typeof pageToken !== 'string' || pageToken.length < 1 || pageToken.length > 4096)) {
      throw new Error('Malformed OSV pagination token')
    }
    return { advisories, pageToken: pageToken ?? null }
  })
}

export async function queryOsvAdvisories(dependencies, fetcher = globalThis.fetch) {
  const matched = new Map()
  let pending = dependencies.map((dep, index) => ({ ...dep, index, pageToken: null }))
  // Complete OSV pagination before reporting any clear result.
  for (let page = 0; page < MAX_RESPONSE_PAGES && pending.length > 0; page += 1) {
    const queries = pending.map(({ name, version, pageToken }) => ({
      package: { name, ecosystem: 'npm' },
      version,
      ...(pageToken ? { page_token: pageToken } : {}),
    }))
    const results = await osvBatch(queries, fetcher)
    const next = []
    results.forEach((result, i) => {
      const selected = pending[i]
      const found = matched.get(selected.index) ?? new Set()
      for (const advisory of result.advisories) found.add(advisory.id)
      matched.set(selected.index, found)
      if (result.pageToken) {
        next.push({ ...selected, pageToken: result.pageToken })
      }
    })
    pending = next
  }
  if (pending.length) {
    throw new Error('OSV response pagination limit reached; completeness not proven')
  }
  return dependencies.map((_, index) =>
    [...(matched.get(index) ?? new Set())].sort().map((id) => ({ id })),
  )
}

/**
 * Build a scope-bound observation record. Deliberately NOT a signed receipt,
 * and never a certificate that code is secure.
 */
export async function buildSentinelReport(packageText, {
  fetcher = globalThis.fetch,
  now = () => new Date(),
  commit = null,
} = {}) {
  const packages = extractDirectDependencies(packageText)
  const pinned = packages.filter((dep) => dep.version !== null)
  const sourceSha256 = createHash('sha256').update(packageText, 'utf8').digest('hex')
  const generatedAt = now().toISOString()
  let providerStatus = pinned.length ? 'unknown' : 'not_queried'
  let providerNote = pinned.length ? 'OSV results not obtained.' : 'No exact versions available to query.'
  if (pinned.length) {
    try {
      const results = await queryOsvAdvisories(pinned, fetcher)
      pinned.forEach((dep, i) => {
        dep.advisories = results[i]
        dep.status = dep.advisories.length ? 'matched' : 'none_reported'
      })
      providerStatus = 'complete'
      providerNote = 'All exact direct dependencies queried; results do not prove safety.'
    } catch (_err) {
      // Network errors, rate limits, invalid responses, and incomplete OSV
      // pagination all become UNKNOWN rather than invented clean results.
      providerStatus = 'unknown'
      providerNote = 'OSV was unavailable, returned invalid data, or did not complete pagination.'
      pinned.forEach((dep) => {
        dep.status = 'unknown'
        dep.advisories = []
        dep.note = 'Advisory status unknown because the external check did not complete.'
      })
    }
  }
  const summary = {
    direct_declared: packages.length,
    exact_versions_queried: providerStatus === 'complete' ? pinned.length : 0,
    matched: packages.filter((dep) => dep.status === 'matched').length,
    none_reported: packages.filter((dep) => dep.status === 'none_reported').length,
    unknown: packages.filter((dep) => dep.status === 'unknown').length,
  }
  return {
    schema: REPORT_SCHEMA,
    subject: 'MichaelWave369/WhiteHatLedger369',
    source: {
      path: 'package.json',
      sha256: sourceSha256,
      git_commit: typeof commit === 'string' && /^[a-f0-9]{40}$/.test(commit) ? commit : null,
      scope: 'direct npm dependencies only; not transitive or deployed versions',
    },
    provider: { name: 'OSV.dev', endpoint: OSV_ENDPOINT, status: providerStatus, note: providerNote },
    generated_at: generatedAt,
    summary,
    packages,
    disclaimer: 'Advisory observations only. Not an exploit confirmation, clean bill of health, or security certification. Unsigned report.',
  }
}
