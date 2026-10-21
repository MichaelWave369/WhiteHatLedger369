import { describe, expect, it } from 'vitest'
import { formatDate, inventoryMetrics, reviewCues, type Repository } from './audit'
import { isValidOwner } from './github'

const example: Repository = {
  id: 1,
  name: 'example',
  full_name: 'owner/example',
  html_url: 'https://github.com/owner/example',
  description: 'Demo repo',
  language: 'TypeScript',
  fork: false,
  archived: false,
  private: false,
  stargazers_count: 0,
  open_issues_count: 0,
  updated_at: '2026-10-01T00:00:00Z',
  pushed_at: '2026-10-01T00:00:00Z',
  default_branch: 'main',
  has_pages: true,
  license: { spdx_id: 'MIT' },
}
const now = Date.parse('2026-10-21T00:00:00Z')

describe('review cues: never represent themselves as vulnerabilities', () => {
  it('does not create a finding when no metadata cue exists', () => {
    expect(reviewCues(example, now)).toEqual([])
  })
  it('identifies missing metadata and inactivity', () => {
    const cues = reviewCues({ ...example, description: null, license: null, pushed_at: '2024-01-01T00:00:00Z' }, now)
    expect(cues.map((cue) => cue.id)).toEqual(['no-description', 'unknown-license', 'dormant'])
  })
  it('does not flag archived repositories for hygiene followup', () => {
    expect(reviewCues({ ...example, archived: true, description: null, license: null }, now)).toEqual([])
  })
  it('counts safely with empty snapshots', () => {
    expect(inventoryMetrics([])).toEqual({ total: 0, active: 0, archived: 0, pagesEnabled: 0, needingMetadataReview: 0 })
  })
  it('separates archived and active inventory records', () => {
    const metrics = inventoryMetrics([example, { ...example, id: 2, archived: true }], now)
    expect(metrics).toMatchObject({ total: 2, active: 1, archived: 1, pagesEnabled: 2, needingMetadataReview: 0 })
  })
  it('handles malformed dates without inventing a timestamp', () => {
    expect(formatDate('not-a-date')).toBe('Unknown')
    expect(formatDate(null)).toBe('Unknown')
  })
})

describe('owner validation', () => {
  it('accepts GitHub username syntax', () => {
    expect(isValidOwner('MichaelWave369')).toBe(true)
    expect(isValidOwner('michael-wave')).toBe(true)
  })
  it('blocks URL tricks or invalid names', () => {
    expect(isValidOwner('https://github.com')).toBe(false)
    expect(isValidOwner('../admin')).toBe(false)
    expect(isValidOwner('not ok')).toBe(false)
    expect(isValidOwner('trailing-')).toBe(false)
  })
})
