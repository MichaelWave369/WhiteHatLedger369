import { useMemo, useState, type ChangeEvent } from 'react'
import { parseAliensEyeJson, privacySafeReceipt, type IdentityReport, type SourceStatus } from './lib/identity'

const sample = {
  scan_summary: { base_username: 'demo_fixture', scan_level: 'DEMO',
    timestamp: 'SYNTHETIC', total_sites_scanned: 3 },
  variations: {
    demo_fixture: { sites: {
      SampleOne: { status: 'Found', confidence: 91, url: '' },
      SampleTwo: { status: 'Maybe', confidence: 54, url: '' },
      SampleThree: { status: 'Not Found', confidence: 84, url: '' },
    } },
  },
}
type ViewFilter = 'ACTIONABLE' | 'ALL' | SourceStatus
const filters: { value: ViewFilter; label: string }[] = [
  { value: 'ACTIONABLE', label: 'Found + Maybe' },
  { value: 'ALL', label: 'All imported' },
  { value: 'FOUND', label: 'Found' },
  { value: 'MAYBE', label: 'Maybe' },
  { value: 'UNKNOWN', label: 'Unknown' },
]

export default function IdentityPanel() {
  const [raw, setRaw] = useState('')
  const [owner, setOwner] = useState('')
  const [asserted, setAsserted] = useState(false)
  const [report, setReport] = useState<IdentityReport | null>(null)
  const [demo, setDemo] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<ViewFilter>('ACTIONABLE')

  const visible = useMemo(() => {
    if (!report) return []
    return report.findings.filter(f => filter === 'ALL' ||
      (filter === 'ACTIONABLE' ? (f.status === 'FOUND' || f.status === 'MAYBE') :
        f.status === filter))
      .sort((a, b) => ({ FOUND: 0, MAYBE: 1, UNKNOWN: 2, NOT_FOUND: 3 }[a.status] -
        { FOUND: 0, MAYBE: 1, UNKNOWN: 2, NOT_FOUND: 3 }[b.status]))
      .slice(0, 60)
  }, [report, filter])

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    setError('')
    setReport(null)
    setDemo(false)
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2_000_000) {
      setError('Report exceeds the 2 MB local import limit.')
      return
    }
    try { setRaw(await file.text()) }
    catch { setError('The browser could not read this local file.') }
    event.target.value = ''
  }

  function review() {
    setError('')
    setReport(null)
    setDemo(false)
    if (!asserted) {
      setError('Confirm that the report concerns accounts you own or have explicit written authorization to assess.')
      return
    }
    try {
      const next = parseAliensEyeJson(raw)
      if (owner.trim() !== next.baseUsername) {
        throw new Error('Scope mismatch: enter the exact base username shown in the report. No report was loaded.')
      }
      setReport(next)
      setFilter('ACTIONABLE')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to import this report.')
    }
  }

  function loadDemo() {
    setReport(parseAliensEyeJson(JSON.stringify(sample)))
    setDemo(true)
    setError('')
    setFilter('ACTIONABLE')
  }

  function clear() {
    setReport(null)
    setRaw('')
    setOwner('')
    setAsserted(false)
    setDemo(false)
    setError('')
  }

  function exportSummary() {
    if (!report) return
    const url = URL.createObjectURL(new Blob([privacySafeReceipt(report)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'whitehat369-identity-summary.json'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <section className="identity-section" aria-labelledby="identity-title">
      <div className="panel-heading">
        <div>
          <span className="section-index">16 / IDENTITY SHIELD · R14</span>
          <h2 id="identity-title">Identity exposure desk</h2>
        </div>
        <span className="identity-badge">LOCAL REPORT REVIEW / NO LIVE SCANNING</span>
      </div>
      <div className="identity-shell">
        <div className="identity-intro">
          <div>
            <span className="gauntlet-kicker">CONSENT FIRST · EVIDENCE BEFORE INFERENCE</span>
            <h3>Know what's public.<br/><span>Don't confuse a match with a person.</span></h3>
            <p>Review a saved <a href="https://github.com/arxhr007/Aliens_eye" target="_blank" rel="noopener noreferrer">ALIENS EYE</a> JSON report for accounts you own or are explicitly authorized to assess. The scanner's <b>Found</b> and <b>Maybe</b> labels are unverified source claims, not proof of ownership, identity correlation or exploitation.</p>
            <p className="identity-caveat">GitHub Pages cannot run Python or reach 840+ websites without a trusted backend. This phase imports and analyzes an existing report entirely in your browser. It does <strong>not</strong> install ALIENS EYE, contact scanned sites, phone home, or store imported data.</p>
          </div>
          <div className="identity-statusbox">
            <span>ASSURANCE LEVEL</span>
            <strong>UNVERIFIED</strong>
            <p>SOURCE-REPORTED / USER-ASSERTED SCOPE</p>
            <small>Consent checkbox is a user declaration, not independent proof of authorization.</small>
          </div>
        </div>

        <div className="identity-inputgrid">
          <div className="identity-import">
            <label htmlFor="identity-file">Local ALIENS EYE JSON file (max 2 MB)</label>
            <input id="identity-file" type="file" accept=".json,application/json" onChange={e => { void onFile(e) }} />
            <label htmlFor="identity-json">Or paste the original JSON report</label>
            <textarea id="identity-json" value={raw} spellCheck={false}
              onChange={e => { setRaw(e.target.value); setReport(null); setDemo(false) }}
              rows={5} placeholder={'{"scan_summary":{"base_username":"your_handle"},"variations":{...}}'} />
          </div>
          <div className="identity-permission">
            <label htmlFor="identity-owner">Authorized base username</label>
            <input id="identity-owner" value={owner} maxLength={80} autoComplete="off"
              placeholder="Type the exact base username"
              onChange={e => { setOwner(e.target.value); setReport(null); setDemo(false) }} />
            <label className="identity-consent">
              <input type="checkbox" checked={asserted}
                onChange={e => { setAsserted(e.target.checked); setReport(null); setDemo(false) }} />
              <span>I own these accounts or have explicit permission to audit this username and its variations. I will not use this tool to target, harass or identify another person.</span>
            </label>
            <div className="identity-buttons">
              <button type="button" className="primary-button" onClick={review}>REVIEW IMPORT</button>
              <button type="button" className="identity-secondary" onClick={loadDemo}>SYNTHETIC DEMO</button>
              <button type="button" className="identity-secondary" onClick={clear}>CLEAR MEMORY</button>
            </div>
            <small>No automatic searches, Tor/proxy traffic, webhooks or cross-profile correlation. Your report stays in this browser tab until you clear it or close the tab.</small>
          </div>
        </div>

        {error && <p role="alert" className="feedback error">{error}</p>}
        {!report && <div className="identity-empty">NO ASSESSMENT LOADED · Import an authorized JSON report, or run the synthetic demonstration.</div>}
        {report && <div className="identity-results" aria-live="polite">
          <div className="identity-summaryhead">
            <div>
              <span>{demo ? 'SYNTHETIC TEST DATA / NOT LIVE EVIDENCE' : 'LOCAL THIRD-PARTY IMPORT / UNVERIFIED'}</span>
              <h4>{demo ? 'Demonstration report' : 'Authorized report review'}</h4>
              <p>Base username: <code>{report.baseUsername}</code> · Level: {report.scanLevel} · Source timestamp: {report.scanTimestamp}</p>
            </div>
            <button type="button" className="identity-secondary" onClick={exportSummary}>EXPORT DE-IDENTIFIED RECEIPT</button>
          </div>
          <div className="identity-metrics">
            <div><b>{report.reportedSitesScanned ?? '—'}</b><span>Sites scanned (source claim)</span></div>
            <div><b>{report.importedRows}</b><span>Rows actually imported</span></div>
            <div><b>{report.counts.FOUND}</b><span>Found (unverified)</span></div>
            <div><b>{report.counts.MAYBE}</b><span>Maybe / investigate</span></div>
            <div><b>{report.counts.UNKNOWN}</b><span>Unknown / errors</span></div>
          </div>
          <p className="identity-warning">
            {report.reportedOnlyFound
              ? 'Source used --only-found. Missing Not Found rows were intentionally omitted and must not be interpreted as successful checks.'
              : 'This report was imported, not independently re-run or authenticated. Absence of a match is not evidence that an account does not exist.'}
            {' '}Found means the scanner reported a profile, <b>not</b> that the person behind it was identified.
          </p>
          <div className="identity-filters">
            {filters.map(option =>
              <button type="button" key={option.value}
                className={filter === option.value ? 'active' : ''}
                aria-pressed={filter === option.value} onClick={() => setFilter(option.value)}>
                {option.label}
              </button>)}
          </div>
          <div className="identity-tablewrap">
            <table>
              <thead><tr><th>Variation</th><th>Site</th><th>Source status</th><th>Score*</th><th>Evidence link</th></tr></thead>
              <tbody>
                {visible.map((finding, index) =>
                  <tr key={finding.variation + ':' + finding.site + ':' + index}>
                    <td>{finding.variation}</td><td>{finding.site}</td>
                    <td><span className={'identity-state identity-' + finding.status.toLowerCase()}>{finding.status.replace('_', ' ')}</span></td>
                    <td>{finding.confidence === null ? 'UNKNOWN' : finding.confidence + '%'}</td>
                    <td>{finding.profileUrl
                      ? <a href={finding.profileUrl} target="_blank" rel="noopener noreferrer">OPEN PUBLIC URL ↗</a>
                      : <span className="identity-muted">No safe HTTPS URL</span>}</td>
                  </tr>)}
              </tbody>
            </table>
          </div>
          <p className="identity-footnote">
            Showing {visible.length} of {report.findings.filter(f => filter === 'ALL' ||
              (filter === 'ACTIONABLE' ? (f.status === 'FOUND' || f.status === 'MAYBE') : f.status === filter)).length} matching rows (60-row display cap).
            {' '}*Score is the scanner's own confidence, not independently calibrated certainty.
            No avatars, biographies, or identity links are extracted or published here.
          </p>
        </div>}
      </div>
    </section>
  )
}
