/**
 * R14 Identity Shield: untrusted ALIENS EYE JSON importer.
 *
 * This module performs no network requests. Scanner labels are vendor claims,
 * never evidence of a person's identity or authorization to investigate them.
 */
export type SourceStatus = 'FOUND' | 'MAYBE' | 'NOT_FOUND' | 'UNKNOWN'
export interface IdentityFinding {
  variation: string
  site: string
  status: SourceStatus
  confidence: number | null
  profileUrl: string | null
}
export interface IdentityReport {
  baseUsername: string
  scanLevel: string
  scanTimestamp: string
  reportedSitesScanned: number | null
  reportedOnlyFound: boolean
  importedRows: number
  findings: IdentityFinding[]
  counts: Record<SourceStatus, number>
  provenance: 'SOURCE_REPORTED_UNVERIFIED'
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const short = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= max

const integer = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

const statusOf = (value: string): SourceStatus =>
  value === 'Found' ? 'FOUND' : value === 'Maybe' ? 'MAYBE' :
  value === 'Not Found' ? 'NOT_FOUND' : 'UNKNOWN'

/** Deliberately permit only external HTTPS URLs, with no embedded credentials. */
export function safeIdentityUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null
  try {
    const uri = new URL(value)
    if (uri.protocol !== 'https:' || uri.username || uri.password ||
      !uri.hostname || uri.hostname === 'localhost' ||
      uri.hostname.endsWith('.localhost')) return null
    return uri.href
  } catch {
    return null
  }
}

/**
 * Accept the real ResultsExporter JSON format:
 * {scan_summary:{base_username,...}, variations:{handle:{sites:{name:{status,...}}}}}
 * Never trust totals to equal imported rows: --only-found omits negatives.
 */
export function parseAliensEyeJson(raw: string): IdentityReport {
  if (raw.length > 2_000_000) throw new Error('Report exceeds the 2 MB local import limit.')
  let decoded: unknown
  try { decoded = JSON.parse(raw) as unknown }
  catch { throw new Error('The file is not valid JSON.') }
  if (!isRecord(decoded) || !isRecord(decoded.scan_summary) ||
    !isRecord(decoded.variations)) {
    throw new Error('Not an ALIENS EYE report: expected scan_summary and variations.')
  }
  const summary = decoded.scan_summary
  if (!short(summary.base_username, 80) || !/^[\w.-]+$/.test(summary.base_username)) {
    throw new Error('Report has an invalid base username.')
  }
  const entries = Object.entries(decoded.variations)
  if (entries.length > 256) throw new Error('Report has too many variations.')
  if (entries.length === 0) throw new Error('Report has no variation records.')
  const findings: IdentityFinding[] = []
  const counts: Record<SourceStatus, number> = { FOUND: 0, MAYBE: 0, NOT_FOUND: 0, UNKNOWN: 0 }

  for (const [variation, detail] of entries) {
    if (!short(variation, 80) || !isRecord(detail) || !isRecord(detail.sites)) {
      throw new Error('Report contains an invalid variation or sites mapping.')
    }
    for (const [site, observation] of Object.entries(detail.sites)) {
      if (findings.length >= 12_000) throw new Error('Report contains too many site records.')
      if (!short(site, 160) || !isRecord(observation) || !short(observation.status, 100)) {
        throw new Error('Report contains a malformed site observation.')
      }
      const status = statusOf(observation.status)
      const confidence = typeof observation.confidence === 'number' &&
        Number.isFinite(observation.confidence) && observation.confidence >= 0 &&
        observation.confidence <= 100 ? observation.confidence : null
      findings.push({
        variation, site, status, confidence,
        profileUrl: safeIdentityUrl(observation.url),
      })
      counts[status]++
    }
  }
  if (summary.total_sites_scanned !== undefined &&
      !integer(summary.total_sites_scanned)) {
    throw new Error('Report has an invalid reported scan count.')
  }

  return {
    baseUsername: summary.base_username,
    scanLevel: typeof summary.scan_level === 'string' ?
      summary.scan_level.slice(0, 60) : 'UNSPECIFIED',
    scanTimestamp: typeof summary.timestamp === 'string' ?
      summary.timestamp.slice(0, 48) : 'UNKNOWN',
    reportedSitesScanned: integer(summary.total_sites_scanned) ?
      summary.total_sites_scanned : null,
    reportedOnlyFound: summary.only_found === true,
    importedRows: findings.length,
    findings,
    counts,
    provenance: 'SOURCE_REPORTED_UNVERIFIED',
  }
}

/**
 * Privacy-minimized receipt only. Intentionally excludes usernames,
 * profile links, site names, biographies, avatars, and inferred connections.
 */
export function privacySafeReceipt(report: IdentityReport): string {
  return JSON.stringify({
    schema: 'whitehatledger369.identity-shield.summary.v1',
    provenance: report.provenance,
    authority: 'USER_ASSERTED_NOT_VERIFIED',
    imported_rows: report.importedRows,
    claimed_sites_scanned: report.reportedSitesScanned,
    only_found_filter: report.reportedOnlyFound,
    source_status_counts: report.counts,
    limitation: 'Imported labels are unverified scanner output; no account ownership or identity linkage established.',
  }, null, 2)
}
