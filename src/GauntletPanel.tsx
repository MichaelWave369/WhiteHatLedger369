import { useState } from 'react'
import {
  FIXTURE_PACK,
  gauntletCatalog,
  runGauntlet,
  type GauntletReport,
  type FaultMode,
} from './lib/gauntlet'

const catalog = gauntletCatalog()

const reasonLabels: Record<string, string> = {
  authorized: 'CAPABILITY AUTHORIZED',
  outside_lab: 'BLOCKED · OUTSIDE LAB',
  wrong_target: 'BLOCKED · WRONG TARGET',
  expired_grant: 'BLOCKED · EXPIRED',
  not_yet_valid: 'BLOCKED · NOT YET VALID',
  capability_denied: 'BLOCKED · CAPABILITY DENIED',
  replay: 'BLOCKED · REPLAY DETECTED',
  artifact_changed: 'BLOCKED · DIGEST MISMATCH',
}

function EvidenceResult({
  title,
  actual,
  expected,
}: {
  title: string
  actual: { verdict: 'ALLOW' | 'BLOCK'; reason: string }
  expected: 'ALLOW' | 'BLOCK'
}) {
  return (
    <div className="gauntlet-evidence">
      <span className="gauntlet-evidence-label">{title} <small>(expected {expected})</small></span>
      <span className={actual.verdict === expected ? 'gauntlet-evidence-ok' : 'gauntlet-evidence-bad'}>
        {reasonLabels[actual.reason] ?? actual.reason}
      </span>
    </div>
  )
}

export default function GauntletPanel() {
  const [report, setReport] = useState<GauntletReport | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(catalog[0]?.id ?? '')

  async function run(mode: FaultMode) {
    setBusy(true)
    setError('')
    setReport(null)
    try {
      const output = await runGauntlet(mode)
      setReport(output)
      setSelected(output.cases.find(entry => entry.verdict === 'FAIL')?.id ?? output.cases[0]?.id ?? '')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Local lab execution failed')
    } finally {
      setBusy(false)
    }
  }

  function exportReport() {
    if (!report) return
    const payload = new Blob([JSON.stringify(report, null, 2) + '\n'], { type: 'application/json' })
    const href = URL.createObjectURL(payload)
    const link = document.createElement('a')
    link.href = href
    link.download = `whitehat-gauntlet-${report.mode}-${report.runId}.json`
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(href), 1000)
  }

  const selectedCase = report?.cases.find(entry => entry.id === selected)
  const selectedCatalog = catalog.find(entry => entry.id === selected)
  const results = report?.cases ?? []

  return (
    <section className="gauntlet" aria-labelledby="gauntlet-title">
      <div className="panel-heading">
        <div>
          <span className="section-index">04 / WHITEHAT GAUNTLET · R2</span>
          <h2 id="gauntlet-title">The controlled breach lab</h2>
        </div>
        <span className="gauntlet-badge">OFFLINE / SYNTHETIC</span>
      </div>

      <div className="gauntlet-shell">
        <div className="gauntlet-top">
          <div className="gauntlet-intro">
            <span className="gauntlet-kicker">◈ CONSENT-FIRST · ZERO LIVE TARGETS</span>
            <h3>Try to break the <span>fixture</span>.</h3>
            <p>Seven deterministic exercises confront an in-memory policy gate with invalid scope, expired authority, altered artifacts, and other suspicious requests. Each also runs an authorized positive control.</p>
            <div className="gauntlet-actions">
              <button type="button" className="gauntlet-run" disabled={busy} onClick={() => void run('none')}>
                {busy ? 'RUNNING LOCAL EXERCISES…' : 'RUN DEFENDED GAUNTLET'} <span aria-hidden="true">↗</span>
              </button>
              <button type="button" className="gauntlet-fault" disabled={busy} onClick={() => void run('replay-disabled')}>
                INJECT REPLAY FAULT
              </button>
            </div>
            <p className="gauntlet-inline-note">
              Fault injection intentionally disables one <em>simulated</em> replay control so you can see a detected failure.
              This never changes a production application or makes network calls.
            </p>
          </div>

          <div className="gauntlet-orb" aria-hidden="true">
            <div className="gauntlet-ring gauntlet-ring-outer"><div className="gauntlet-ring gauntlet-ring-inner"><span>W</span><small>369</small></div></div>
            <div className="gauntlet-orb-caption">SCOPE ∙ POLICY ∙ EVIDENCE</div>
          </div>
        </div>

        <div className="gauntlet-stats" aria-live="polite">
          <div><span>EXERCISES</span><strong>{report?.summary.total ?? catalog.length}</strong><small>Local fixtures only</small></div>
          <div><span>CONTROLS VERIFIED</span><strong className="gauntlet-positive">{report?.summary.passed ?? '—'}</strong><small>Authorized + adversarial</small></div>
          <div><span>CONTROL FAILURES</span><strong className={report?.summary.failed ? 'gauntlet-negative' : ''}>{report?.summary.failed ?? '—'}</strong><small>Only within the simulation</small></div>
          <div><span>RUN MODE</span><strong className="gauntlet-mode">{report ? (report.mode === 'none' ? 'DEFENDED' : 'FAULT INJECTED') : 'NOT RUN'}</strong><small>{report ? new Date(report.generatedAt).toLocaleString() : 'No evidence yet'}</small></div>
        </div>

        {error && <div className="feedback error" role="alert">{error}. No result was recorded.</div>}

        <div className="gauntlet-workbench">
          <div className="gauntlet-catalog" role="group" aria-label="Select a simulated security exercise">
            <div className="gauntlet-list-heading">SCENARIO REGISTRY <span>{catalog.length} FIXTURES</span></div>
            {catalog.map((item, index) => {
              const result = results.find(entry => entry.id === item.id)
              return (
                <button
                  type="button"
                  className={selected === item.id ? 'gauntlet-case selected' : 'gauntlet-case'}
                  key={item.id}
                  onClick={() => setSelected(item.id)}
                  aria-pressed={selected === item.id}
                >
                  <span className="gauntlet-case-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="gauntlet-case-name"><b>{item.title}</b><small>{item.category}</small></span>
                  <span className={result?.verdict === 'FAIL' ? 'gauntlet-fail' : result?.verdict === 'PASS' ? 'gauntlet-pass' : 'gauntlet-unrun'}>{result?.verdict ?? 'PENDING'}</span>
                </button>
              )
            })}
          </div>
          <div className="gauntlet-detail">
            <span className="gauntlet-detail-top">TRAINING SCENARIO / {selectedCase?.id ?? selectedCatalog?.id}</span>
            <h4>{selectedCase?.title ?? selectedCatalog?.title}</h4>
            <p>{selectedCase?.description ?? selectedCatalog?.description}</p>

            {selectedCase ? (
              <>
                <div className="gauntlet-evidence-box">
                  <EvidenceResult title="Positive control" actual={selectedCase.control} expected="ALLOW" />
                  <EvidenceResult title="Adversarial probe" actual={selectedCase.probe} expected="BLOCK" />
                </div>
                <div className={selectedCase.verdict === 'PASS' ? 'gauntlet-outcome is-pass' : 'gauntlet-outcome is-fail'}>
                  <strong>{selectedCase.verdict === 'PASS' ? 'PASS: FIXTURE BEHAVED AS EXPECTED' : 'FAIL: THE SIMULATED CONTROL DID NOT HOLD'}</strong>
                  <p>{selectedCase.verdict === 'PASS'
                    ? 'The authorized control was allowed and the synthetic adversarial probe was blocked.'
                    : 'The injected weakness or guard defect allowed an adversarial probe, or a positive control was rejected. This finding applies to the fixture only.'}</p>
                </div>
              </>
            ) : (
              <div className="gauntlet-awaiting">
                Choose a run mode to execute this synthetic test. Expected result: an authorized baseline is allowed and the adversarial probe is blocked.
              </div>
            )}
          </div>
        </div>

        <div className="gauntlet-bottom">
          <div>
            <span className="gauntlet-kicker">EVIDENCE / LOCAL ONLY</span>
            <p>{report ? `Run ${report.runId.slice(0, 8)} · ${FIXTURE_PACK} · ${report.summary.passed}/${report.summary.total} verified` : 'No receipts generated. Run a lab fixture first.'}</p>
            <small>Export is an unsigned JSON observation, not an attestation or cryptographic signature.</small>
          </div>
          <button type="button" disabled={!report || busy} className="gauntlet-export" onClick={exportReport}>EXPORT LAB RECEIPT ↓</button>
        </div>
      </div>
      <p className="gauntlet-scope">
        <strong>DO NOT CONFUSE A DEMONSTRATION WITH A SECURITY AUDIT.</strong> R2 exercises only built-in `lab://` fixtures in memory. It does not contact targets, run external code, train an AI, validate a real agent, or establish the security of WhiteHatLedger369, other PHI369 systems, or any real infrastructure.
      </p>
    </section>
  )
}
