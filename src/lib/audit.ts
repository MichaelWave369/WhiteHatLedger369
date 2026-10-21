/**
 * Review cues are metadata hygiene reminders, NOT security findings.
 * No vulnerability assessment is performed by R0.
 */
export interface Repository {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  language: string | null
  fork: boolean
  archived: boolean
  private: boolean
  stargazers_count: number
  open_issues_count: number
  updated_at: string | null
  pushed_at: string | null
  default_branch: string
  has_pages: boolean
  license: { spdx_id: string | null } | null
}

export interface ReviewCue {
  id: 'no-description' | 'unknown-license' | 'dormant'
  label: string
}

const YEAR_MS = 365 * 24 * 60 * 60 * 1000

export function reviewCues(repo: Repository, now = Date.now()): ReviewCue[] {
  if (repo.archived) return []
  const cues: ReviewCue[] = []
  if (!repo.description?.trim()) {
    cues.push({ id: 'no-description', label: 'Description missing' })
  }
  if (!repo.license || !repo.license.spdx_id || repo.license.spdx_id === 'NOASSERTION') {
    cues.push({ id: 'unknown-license', label: 'License not identified' })
  }
  if (repo.pushed_at) {
    const pushed = Date.parse(repo.pushed_at)
    if (Number.isFinite(pushed) && now - pushed >= YEAR_MS) {
      cues.push({ id: 'dormant', label: 'No push in 12+ months' })
    }
  }
  return cues
}

export function inventoryMetrics(repos: Repository[], now = Date.now()) {
  return {
    total: repos.length,
    active: repos.filter((repo) => !repo.archived).length,
    archived: repos.filter((repo) => repo.archived).length,
    pagesEnabled: repos.filter((repo) => repo.has_pages).length,
    needingMetadataReview: repos.filter((repo) => reviewCues(repo, now).length > 0).length,
  }
}

export function formatDate(value: string | null): string {
  if (!value) return 'Unknown'
  const time = Date.parse(value)
  if (!Number.isFinite(time)) return 'Unknown'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(time)
}
