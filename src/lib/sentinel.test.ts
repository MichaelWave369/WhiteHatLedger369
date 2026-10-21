import { describe, expect, it } from 'vitest'
import { isSentinelReport, isStale, type SentinelReport } from './sentinel'

const valid: SentinelReport = {
  schema: 'whitehatledger369.sentinel.v1',
  subject: 'MichaelWave369/WhiteHatLedger369',
  source: { path: 'package.json', sha256: 'a'.repeat(64), git_commit: 'b'.repeat(40), scope: 'direct npm' },
  provider: { name: 'OSV.dev', endpoint: 'https://api.osv.dev/v1/querybatch', status: 'complete', note: 'Bounded scope.' },
  generated_at: '2026-10-21T00:00:00.000Z',
  summary: { direct_declared: 1, exact_versions_queried: 1, matched: 0, none_reported: 1, unknown: 0 },
  packages: [{ name: 'react', section: 'dependencies', declared: '19.1.1', version: '19.1.1', status: 'none_reported', advisories: [] }],
  disclaimer: 'Not a security certificate',
}

describe('Sentinel report validation', () => {
  it('accepts complete reports', () => {
    expect(isSentinelReport(valid)).toBe(true)
  })
  it('rejects broken summaries', () => {
    expect(isSentinelReport({ ...valid, summary: { ...valid.summary, matched: 2 } })).toBe(false)
  })
  it('rejects a changed subject', () => {
    expect(isSentinelReport({ ...valid, subject: 'some-other-repo' })).toBe(false)
  })
  it('distinguishes stale data', () => {
    expect(isStale(valid, Date.parse('2026-10-21T23:00:00Z'))).toBe(false)
    expect(isStale(valid, Date.parse('2026-10-24T00:00:00Z'))).toBe(true)
  })
  it('shows placeholder as stale', () => {
    expect(isStale({ ...valid, generated_at: null })).toBe(true)
  })
})
