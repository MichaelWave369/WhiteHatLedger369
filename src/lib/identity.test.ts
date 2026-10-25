import { describe, expect, it } from 'vitest'
import { parseAliensEyeJson, privacySafeReceipt, safeIdentityUrl } from './identity'

const example = {
  scan_summary: {
    base_username: 'self_audit',
    scan_level: 'basic',
    timestamp: '20261024_121010',
    total_sites_scanned: 840,
    only_found: true,
  },
  variations: {
    self_audit: {
      scan_info: { sites_scanned: 840, found: 1, maybe: 1 },
      sites: {
        ExampleSite: {
          status: 'Found', confidence: 92, url: 'https://example.org/self_audit',
          ai_analysis: { signals: { profile: { bio: 'private information' } } },
        },
        AnotherSite: {
          status: 'Maybe', confidence: 58, url: 'javascript:alert(1)',
        },
        Timeout: { status: 'Rate limited', confidence: 101, url: 'http://example.org' },
      },
    },
  },
}
describe('R14 Identity Shield importer', () => {
  it('parses real ALIENS EYE JSON structure without elevating claims', () => {
    const report = parseAliensEyeJson(JSON.stringify(example))
    expect(report.provenance).toBe('SOURCE_REPORTED_UNVERIFIED')
    expect(report.reportedSitesScanned).toBe(840)
    expect(report.reportedOnlyFound).toBe(true)
    expect(report.importedRows).toBe(3)
    expect(report.counts).toEqual({ FOUND: 1, MAYBE: 1, NOT_FOUND: 0, UNKNOWN: 1 })
    expect(report.findings[0].profileUrl).toBe('https://example.org/self_audit')
    expect(report.findings[1].profileUrl).toBeNull()
    expect(report.findings[2].confidence).toBeNull()
  })
  it('keeps --only-found reports partial instead of calling missing rows not found', () => {
    const report = parseAliensEyeJson(JSON.stringify(example))
    expect(report.importedRows).toBeLessThan(report.reportedSitesScanned!)
    expect(report.counts.NOT_FOUND).toBe(0)
  })
  it('rejects unknown shapes and malformed records', () => {
    for (const raw of ['oops', '{}', '{"variations":{}}',
      JSON.stringify({ ...example, variations: [] }),
      JSON.stringify({ ...example, variations: { self_audit: { sites: { X: {} } } } }),
    ]) expect(() => parseAliensEyeJson(raw)).toThrow()
  })
  it('limits input size and rejects invalid numeric scan totals', () => {
    expect(() => parseAliensEyeJson('x'.repeat(2_000_001))).toThrow(/limit/)
    expect(() => parseAliensEyeJson(JSON.stringify({
      ...example, scan_summary: { ...example.scan_summary, total_sites_scanned: -1 },
    }))).toThrow(/scan count/)
  })
  it('rejects insecure and active URL schemes and URL credentials', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd',
      'http://example.org', 'https://user:pass@example.org', 'https://localhost:3333']) {
      expect(safeIdentityUrl(url)).toBeNull()
    }
    expect(safeIdentityUrl('https://example.com/profile')).toBe('https://example.com/profile')
  })
  it('exports a de-identified receipt without personally identifying details', () => {
    const receipt = privacySafeReceipt(parseAliensEyeJson(JSON.stringify(example)))
    expect(receipt).toContain('SOURCE_REPORTED_UNVERIFIED')
    expect(receipt).not.toContain('self_audit')
    expect(receipt).not.toContain('ExampleSite')
    expect(receipt).not.toContain('example.org')
    expect(receipt).not.toContain('private information')
  })
})
