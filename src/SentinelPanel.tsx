import { useEffect, useState } from 'react'
import { fetchSentinelReport, isStale, type SentinelReport } from './lib/sentinel'

export default function SentinelPanel() {
  const [report, setReport] = useState<SentinelReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    void fetchSentinelReport(controller.signal).then((snapshot) => {
      if (!controller.signal.aborted) setReport(snapshot)
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Unable to read Sentinel report.')
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [])

  const stale = report ? isStale(report) : true
  const providerComplete = report?.provider.status === 'complete' && !stale
  const badgeText = loading ? 'LOADING' : error ? 'INVALID / UNAVAILABLE' : stale ? 'STALE / NOT RUN' : report?.provider.status === 'complete' ? 'SOURCE REPLIED' : 'UNKNOWN'

  return (
    <section className="sentinel" aria-labelledby="sentinel-title">
      <div className="panel-heading">
        <div><span className="section-index">03 / SENTINEL · R1</span><h2 id="sentinel-title">Advisory observatory</h2></div>
        <span className={providerComplete ? 'sentinel-badge available' : 'sentinel-badge'}>{badgeText}</span>
      </div>
      <div className="sentinel-body">
        <div className="sentinel-summary">
          <div>
            <span className="sentinel-scope">SCOPE / THIS PROJECT ONLY</span>
            <h3>WhiteHatLedger369</h3>
            <p>Read-only OSV.dev lookup for <strong>exactly pinned, direct npm dependencies declared in package.json</strong>. This does <em>not</em> analyze the other repositories in the inventory, transitive packages, running servers, deployed versions, or PHP.</p>
            {report && <div className="sentinel-timestamp">Report: {report.generated_at ? new Date(report.generated_at).toLocaleString() : 'Never generated'} · Provider: {report.provider.name}</div>}
            {error && <div className="feedback error" role="alert">{error} All advisory statuses remain unknown.</div>}
            {!error && stale && <div className="sentinel-notice" role="status">No current completed advisory lookup is available. Treat all unreported conditions as UNKNOWN, not secure.</div>}
            {report && !stale && report.provider.status !== 'complete' && <div className="sentinel-notice" role="status">External advisory lookup did not complete. Package statuses are unknown where not queryable.</div>}
          </div>
          <div className="sentinel-stats" aria-label="Direct dependency advisory observations">
            <div><strong>{report && !stale ? report.summary.direct_declared : '—'}</strong><span>DIRECT DECLARED</span></div>
            <div><strong>{providerComplete ? report?.summary.matched : '—'}</strong><span>WITH OSV MATCHES</span></div>
            <div><strong>{providerComplete ? report?.summary.none_reported : '—'}</strong><span>NO MATCH REPORTED</span></div>
            <div><strong>{report && !stale ? report.summary.unknown : '—'}</strong><span>UNKNOWN</span></div>
          </div>
        </div>
        {report && providerComplete && (
          <div className="sentinel-results">
            <div className="sentinel-table-heading"><span>DEPENDENCY</span><span>DECLARED SPEC</span><span>OBSERVATION</span></div>
            {report.packages.map((pkg) => (
              <div className="sentinel-row" key={pkg.name}>
                <span className="sentinel-package">{pkg.name}</span>
                <code>{pkg.declared}</code>
                <div>
                  <span className={pkg.status === 'matched' ? 'sentinel-status alert' : pkg.status === 'unknown' ? 'sentinel-status uncertain' : 'sentinel-status unconfirmed'}>
                    {pkg.status === 'matched' ? 'OSV MATCH' : pkg.status === 'unknown' ? 'UNKNOWN' : 'NONE REPORTED'}
                  </span>
                  {pkg.advisories.length > 0 && <div className="advisory-links">
                    {pkg.advisories.map((a) => <a key={a.id} href={`https://osv.dev/vulnerability/${encodeURIComponent(a.id)}`} target="_blank" rel="noopener noreferrer">{a.id} ↗</a>)}
                  </div>}
                </div>
              </div>
            ))}
            {report.packages.length === 0 && <div className="empty-state">No direct dependencies declared. Nothing was checked.</div>}
          </div>
        )}
        <div className="sentinel-footnote"><strong>LIMITED EVIDENCE.</strong> A zero-match result does not prove safety. This is an unsigned, time-bounded advisory observation. Releases, permissions, installed dependency trees, and all other repositories remain unassessed. <a href="https://osv.dev/" target="_blank" rel="noopener noreferrer">OSV.dev ↗</a></div>
      </div>
    </section>
  )
}
