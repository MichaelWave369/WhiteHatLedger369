import type { Repository } from './audit'

export const DEFAULT_OWNER = 'MichaelWave369'
const PAGE_SIZE = 100
const MAX_PAGES = 40
const GITHUB_API = 'https://api.github.com'

export interface InventorySnapshot {
  owner: string
  repositories: Repository[]
  fetchedAt: string
  requestsMade: number
}

export function isValidOwner(owner: string): boolean {
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37})$/.test(owner) && !owner.endsWith('-')
}

export class InventoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InventoryError'
  }
}

export async function fetchPublicInventory(
  owner: string,
  signal: AbortSignal,
  onProgress?: (count: number) => void,
): Promise<InventorySnapshot> {
  const cleanOwner = owner.trim()
  if (!isValidOwner(cleanOwner)) {
    throw new InventoryError('Enter a valid GitHub username (letters, numbers, or hyphens).')
  }

  const results: Repository[] = []
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(`${GITHUB_API}/users/${encodeURIComponent(cleanOwner)}/repos`)
    url.searchParams.set('per_page', String(PAGE_SIZE))
    url.searchParams.set('page', String(page))
    url.searchParams.set('type', 'owner')
    url.searchParams.set('sort', 'updated')
    url.searchParams.set('direction', 'desc')

    const response = await fetch(url.toString(), {
      signal,
      credentials: 'omit',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    if (!response.ok) {
      if (response.status === 404) throw new InventoryError('GitHub user not found.')
      if (response.status === 403 || response.status === 429) {
        const reset = response.headers.get('x-ratelimit-reset')
        const limitNote = reset && Number.isFinite(Number(reset))
          ? ` Rate-limit reset: ${new Date(Number(reset) * 1000).toLocaleTimeString()}.`
          : ''
        throw new InventoryError(`GitHub API access limited (${response.status}).${limitNote} Please retry later.`)
      }
      throw new InventoryError(`GitHub returned HTTP ${response.status}. Inventory is not complete.`)
    }

    const payload: unknown = await response.json()
    if (!Array.isArray(payload)) throw new InventoryError('Unexpected GitHub response. Inventory not trusted.')
    const rows = payload as Repository[]
    if (rows.some((row) => !row || typeof row.id !== 'number' || typeof row.name !== 'string')) {
      throw new InventoryError('Unexpected repository data from GitHub. Inventory not trusted.')
    }
    // Public endpoint. Reject any unexpected private result rather than displaying it.
    if (rows.some((row) => row.private)) {
      throw new InventoryError('Unexpected private repository metadata. Inventory stopped.')
    }

    results.push(...rows)
    onProgress?.(results.length)
    if (rows.length < PAGE_SIZE) {
      const unique = new Map(results.map((repo) => [repo.id, repo]))
      return {
        owner: cleanOwner,
        repositories: [...unique.values()],
        fetchedAt: new Date().toISOString(),
        requestsMade: page,
      }
    }
  }

  // Fail closed: never display the first 4,000 repos as a supposedly complete inventory.
  throw new InventoryError('Inventory exceeded the 4,000-repository safety cap. No complete snapshot available.')
}
