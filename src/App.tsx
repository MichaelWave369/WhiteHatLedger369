import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { formatDate, inventoryMetrics, reviewCues, type Repository } from './lib/audit'
import { DEFAULT_OWNER, fetchPublicInventory, isValidOwner, type InventorySnapshot } from './lib/github'
import SentinelPanel from './SentinelPanel'
import GauntletPanel from './GauntletPanel'
import MinotaurPanel from './MinotaurPanel'
import AuthorityPanel from './AuthorityPanel'
import EvidencePanel from './EvidencePanel'
import GuardianPanel from './GuardianPanel'
import ProvenancePanel from './ProvenancePanel'
import ArtifactPanel from './ArtifactPanel'
import AttestationPanel from './AttestationPanel'
import CustodyPanel from './CustodyPanel'
import IncidentPanel from './IncidentPanel'

type Filter = 'all' | 'review' | 'active' | 'archived'
type FetchState = 'loading' | 'ready' | 'error'
const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All repositories' },
  { key: 'review', label: 'Metadata review' },
  { key: 'active', label: 'Active' },
  { key: 'archived', label: 'Archived' },
]

function Mark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 44" fill="none" aria-hidden="true">
      <path d="M20 2 36 8v12c0 10-6.6 17.6-16 21C10.6 37.6 4 30 4 20V8L20 2Z" stroke="currentColor" strokeWidth="2.5"/>
      <path d="m12.5 21 5.1 5.1L28 15.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function Metric({ value, label, detail }: { value: string | number; label: string; detail: string }) {
  return (
    <div className="metric">
      <div className="metric-number">{value}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-detail">{detail}</div>
    </div>
  )
}

function RepositoryCard({ repo, now }: { repo: Repository; now: number }) {
  const cues = reviewCues(repo, now)
  return (
    <article className="repo-card">
      <div className="repo-head">
        <div className="repo-icon" aria-hidden="true">⌘</div>
        <div className="repo-title-wrap">
          <h3><a href={repo.html_url} target="_blank" rel="noopener noreferrer">{repo.name}<span className="outbound" aria-hidden="true"> ↗</span></a></h3>
          <span className="repo-owner">{repo.full_name}</span>
        </div>
        <span className={repo.archived ? 'status archived' : 'status unknown'}>
          {repo.archived ? 'ARCHIVED' : 'UNASSESSED'}
        </span>
      </div>
      <p className="repo-description">{repo.description?.trim() || 'No repository description provided.'}</p>
      <div className="repo-chips">
        <span>{repo.language || 'Language unknown'}</span>
        <span>{repo.fork ? 'Fork' : 'Source'}</span>
        {repo.has_pages && <span>Pages configured</span>}
        <span>★ {repo.stargazers_count}</span>
      </div>
      <div className="repo-footer">
        <span>Last push: <strong>{formatDate(repo.pushed_at)}</strong></span>
        {cues.length > 0 ? <span className="cue-count">{cues.length} metadata cue{cues.length !== 1 ? 's' : ''}</span> : <span className="no-cues">No metadata cues</span>}
      </div>
      {cues.length > 0 && (
        <div className="repo-cues" aria-label="Metadata review cues">
          {cues.map((cue) => <span key={cue.id}>{cue.label}</span>)}
        </div>
      )}
    </article>
  )
}

export default function App() {
  const initialOwner = (() => {
    const requested = new URLSearchParams(window.location.search).get('owner')
    return requested && isValidOwner(requested) ? requested : DEFAULT_OWNER
  })()
  const [inputOwner, setInputOwner] = useState(initialOwner)
  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null)
  const [state, setState] = useState<FetchState>('loading')
  const [error, setError] = useState('')
  const [loadedCount, setLoadedCount] = useState(0)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [language, setLanguage] = useState('all')
  const [page, setPage] = useState(1)
  const currentRequest = useRef<AbortController | null>(null)
  const perPage = 18

  const load = useCallback(async (owner: string) => {
    currentRequest.current?.abort()
    const controller = new AbortController()
    currentRequest.current = controller
    setState('loading')
    setError('')
    setLoadedCount(0)
    setSnapshot(null)
    setFilter('all')
    setLanguage('all')
    setSearch('')
    setPage(1)
    try {
      const next = await fetchPublicInventory(owner, controller.signal, setLoadedCount)
      if (controller.signal.aborted) return
      setSnapshot(next)
      setState('ready')
      const address = new URL(window.location.href)
      address.searchParams.set('owner', next.owner)
      window.history.replaceState(null, '', address)
    } catch (failure) {
      if (controller.signal.aborted) return
      setError(failure instanceof Error ? failure.message : 'Could not retrieve GitHub inventory.')
      setState('error')
    }
  }, [])

  useEffect(() => {
    void load(initialOwner)
    return () => currentRequest.current?.abort()
    // load is stable. initialOwner is intentionally read only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void load(inputOwner.trim())
  }

  const repos = useMemo(() => snapshot?.repositories ?? [], [snapshot])
  const now = useMemo(() => snapshot ? Date.parse(snapshot.fetchedAt) : Date.now(), [snapshot])
  const metrics = useMemo(() => inventoryMetrics(repos, now), [repos, now])
  const languages = useMemo(() => [...new Set(repos.map((r) => r.language).filter((l): l is string => Boolean(l)))].sort(), [repos])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return repos.filter((repo) => {
      if (filter === 'review' && reviewCues(repo, now).length === 0) return false
      if (filter === 'active' && repo.archived) return false
      if (filter === 'archived' && !repo.archived) return false
      if (language !== 'all' && repo.language !== language) return false
      if (term && ![repo.name, repo.full_name, repo.description ?? '', repo.language ?? ''].some((field) => field.toLowerCase().includes(term))) return false
      return true
    })
  }, [repos, filter, language, search, now])

  const maxPage = Math.max(1, Math.ceil(filtered.length / perPage))
  const currentPage = Math.min(page, maxPage)
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div className="app">
      <div className="top-line" />
      <header className="site-header shell">
        <a className="brand" href="./" aria-label="WhiteHatLedger369 homepage">
          <div className="brand-mark"><Mark /></div>
          <div><div className="brand-name">WHITEHAT<span>LEDGER</span><b>369</b></div><div className="brand-caption">ETHICAL REVERSE LAB</div></div>
        </a>
        <div className="header-right"><span className="header-dot" /> READ-ONLY / PUBLIC DATA <span className="header-version">R11 · INCIDENT DESK</span></div>
      </header>

      <main className="shell">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow"><span className="small-square" /> PHI369 SECURITY & ADVERSARIAL ASSURANCE</span>
            <h1 id="hero-title">THE <span>WATCHTOWER</span></h1>
            <p className="hero-lead">Know your surface.<br/>Prove your claims.</p>
            <p className="hero-text">A clear view of the public repository landscape. Evidence-led inventory, transparent unknowns, and a foundation for consent-first security assurance.</p>
            <div className="hero-tags"><span>◈ CONSENT FIRST</span><span>◈ RECEIPTS OVER VIBES</span><span>◈ NO TOKENS IN BROWSER</span></div>
          </div>
          <div className="hero-emblem" aria-hidden="true">
            <div className="emblem-circle outer"><div className="emblem-circle inner"><Mark size={118} /></div></div>
            <span className="emblem-label top">VERIFY THE EVIDENCE</span>
            <span className="emblem-label bottom">NOTHING CLAIMED WITHOUT PROOF</span>
          </div>
        </section>

        <section className="scope-banner" aria-label="Assessment scope">
          <div className="scope-icon" aria-hidden="true">i</div>
          <div><strong>KNOW EXACTLY WHAT WAS TESTED.</strong><p>The inventory shows public GitHub metadata. R1 separately checks <b>only WhiteHatLedger369's own exactly pinned direct npm dependencies</b> against OSV.dev. Other repositories, transitive dependencies, deployment configurations, PHP runtimes, credentials, and permissions remain <b>UNASSESSED</b>.</p></div>
        </section>

        <section className="control-panel" aria-label="Repository controls">
          <div className="panel-heading"><div><span className="section-index">01 / DISCOVERY</span><h2>Repository inventory</h2></div><span className="api-badge"><span className="live-dot" /> GITHUB PUBLIC API</span></div>
          <form className="owner-form" onSubmit={submit}>
            <label htmlFor="github-owner">GitHub owner</label>
            <div className="owner-row"><div className="owner-input-wrap"><span aria-hidden="true">@</span><input id="github-owner" value={inputOwner} onChange={(event) => setInputOwner(event.target.value)} maxLength={39} spellCheck={false} autoComplete="off" placeholder="GitHub username" /></div><button className="primary-button" type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'DISCOVERING…' : 'SCAN PUBLIC INVENTORY'} <span aria-hidden="true">↗</span></button></div>
          </form>
          <p className="control-hint">No login required. Reads public GitHub REST API responses only. Large inventories use pagination and may encounter GitHub's anonymous rate limit.</p>
          {state === 'loading' && <div className="feedback loading" role="status"><span className="spinner" /> Discovering public repositories… {loadedCount > 0 ? `${loadedCount} records received so far` : 'Connecting to GitHub'}</div>}
          {state === 'error' && <div className="feedback error" role="alert"><strong>Snapshot unavailable.</strong> {error} No partial results are presented as complete.</div>}
          {state === 'ready' && snapshot && <p className="snapshot-note" role="status">Complete API pagination · {snapshot.requestsMade} request{snapshot.requestsMade !== 1 ? 's' : ''} · Captured {new Date(snapshot.fetchedAt).toLocaleString()} · @{snapshot.owner}</p>}
        </section>

        <section className="metrics-section" aria-label="Inventory metrics">
          <div className="panel-heading metrics-heading"><div><span className="section-index">02 / TELEMETRY</span><h2>Scope at a glance</h2></div><span className="meta-label">PUBLIC REPOSITORY METADATA</span></div>
          <div className="metric-grid">
            <Metric value={state === 'ready' ? metrics.total : '—'} label="Repositories found" detail="Public / owned" />
            <Metric value={state === 'ready' ? metrics.active : '—'} label="Active repositories" detail="Not archived" />
            <Metric value={state === 'ready' ? metrics.archived : '—'} label="Archived repositories" detail="Read-only upstream status" />
            <Metric value={state === 'ready' ? metrics.needingMetadataReview : '—'} label="Metadata review" detail="Hygiene cues, not vulnerabilities" />
          </div>
        </section>

        <SentinelPanel />

        <GauntletPanel />

        <MinotaurPanel />

        <AuthorityPanel />

        <EvidencePanel />

        <GuardianPanel />

        <ProvenancePanel />

        <ArtifactPanel />

        <AttestationPanel />

        <CustodyPanel />

        <IncidentPanel />

        <section className="repository-section" aria-labelledby="repository-title">
          <div className="panel-heading"><div><span className="section-index">14 / CATALOG</span><h2 id="repository-title">Asset registry</h2></div><span className="meta-label">{state === 'ready' ? `${filtered.length} MATCHES` : 'AWAITING VERIFIED SNAPSHOT'}</span></div>
          <div className="catalog-tools">
            <div className="search-wrap"><span aria-hidden="true">⌕</span><input aria-label="Search repositories" placeholder="Search names, descriptions, languages…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} disabled={state !== 'ready'} /></div>
            <select aria-label="Filter language" value={language} onChange={(event) => { setLanguage(event.target.value); setPage(1) }} disabled={state !== 'ready'}><option value="all">All languages</option>{languages.map((l) => <option key={l} value={l}>{l}</option>)}</select>
          </div>
          <div className="filter-tabs" role="group" aria-label="Repository filters">{filters.map(({ key, label }) => <button type="button" key={key} className={filter === key ? 'tab active' : 'tab'} disabled={state !== 'ready'} aria-pressed={filter === key} onClick={() => { setFilter(key); setPage(1) }}>{label}</button>)}</div>
          {state === 'ready' && (
            <>
              <div className="repo-grid">{visible.map((repo) => <RepositoryCard repo={repo} now={now} key={repo.id} />)}</div>
              {filtered.length === 0 && <div className="empty-state">No repositories match these filters. This is not a security finding.</div>}
              {filtered.length > perPage && <div className="pagination"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>← Previous</button><span>Page {currentPage} of {maxPage}</span><button disabled={currentPage === maxPage} onClick={() => setPage(currentPage + 1)}>Next →</button></div>}
            </>
          )}
          {state !== 'ready' && <div className="empty-state">Inventory cards appear only when all public API pages have been retrieved successfully.</div>}
        </section>

        <section className="next-stage">
          <span className="section-index">15 / NEXT MISSION</span><h2>From incident triage to controlled recovery.</h2>
          <p>R11 preserves post-deployment failures as operator-review packets and introduces a non-destructive incident response desk. Next: explicit owner-approved rollback proposals, release promotion controls, and separately attested operator closure receipts. Nothing should auto-resolve just because a later run turns green.</p>
          <div className="stage-steps"><span><b>R0</b> INVENTORY</span><span><b>R1</b> ADVISORIES</span><span><b>R2</b> GAUNTLET</span><span><b>R3</b> MINOTAUR</span><span><b>R4</b> SIGNED FIXTURES</span><span><b>R5</b> SIGNED RECEIPTS</span><span><b>R6</b> POLICY ENGINE</span><span><b>R7</b> DEPENDENCIES</span><span><b>R8</b> BUILD HASHES</span><span><b>R9</b> ATTESTATIONS</span><span><b>R10</b> CUSTODY</span><span><b>R11</b> INCIDENTS</span></div>
        </section>
      </main>
      <footer className="site-footer shell"><div><Mark size={22} /> WHITEHATLEDGER369 <span>·</span> LEDGER ABOVE EGO.</div><p>R0 WATCHTOWER · R1 SENTINEL · R2 GAUNTLET · R3 MINOTAUR · R4 AUTHORITY · R5 EVIDENCE · R6 GUARDIAN · R7 LOCKFILE · R8 ARTIFACT · R9 ATTESTATION · R10 CUSTODY · R11 INCIDENTS. NOT CERTIFIED SECURE. <a href="https://github.com/MichaelWave369/WhiteHatLedger369" target="_blank" rel="noopener noreferrer">SOURCE ↗</a></p></footer>
    </div>
  )
}
