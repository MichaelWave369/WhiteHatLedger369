import { useMemo, useState } from 'react'
import {
  MINOTAUR_EVENTS, MINOTAUR_LEVELS, advanceMinotaur, checkSyntheticCapability,
  createMinotaurObservation, createMinotaurState, currentTier, runMinotaurSequence,
  type MinotaurCapability,
  type MinotaurState,
} from './lib/minotaur'

const availableChecks: MinotaurCapability[] = ['observe', 'inspect', 'simulate', 'export', 'grant']

export default function MinotaurPanel() {
  const [state, setState] = useState<MinotaurState>(() => createMinotaurState())
  const [eventCursor, setEventCursor] = useState(0)
  const [capability, setCapability] = useState<MinotaurCapability>('simulate')
  const [checkLog, setCheckLog] = useState<ReturnType<typeof checkSyntheticCapability>[]>([])
  const tier = currentTier(state)
  const total = MINOTAUR_EVENTS.length
  const remaining = Math.max(0, total - eventCursor)
  const recent = useMemo(() => [...state.transitions].reverse(), [state.transitions])

  function reset() {
    setState(createMinotaurState())
    setEventCursor(0)
    setCheckLog([])
  }

  function advance() {
    if (remaining === 0) return
    setState(prev => advanceMinotaur(prev, MINOTAUR_EVENTS[eventCursor].id))
    setEventCursor(prev => prev + 1)
    setCheckLog([])
  }

  function fullRun() {
    setState(runMinotaurSequence())
    setEventCursor(total)
    setCheckLog([])
  }

  function checkCapability() {
    const result = checkSyntheticCapability(state, capability)
    setCheckLog(prev => [result, ...prev].slice(0, 6))
  }

  function exportObservation() {
    const observation = createMinotaurObservation(state)
    const objectUrl = URL.createObjectURL(new Blob([JSON.stringify(observation, null, 2) + '\n'], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = 'minotaur-synthetic-observation.json'
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }

  return (
    <section className="minotaur-section" aria-labelledby="minotaur-title">
      <div className="panel-heading">
        <div>
          <span className="section-index">05 / MINOTAUR PROTOCOL · R3</span>
          <h2 id="minotaur-title">The seven gates</h2>
        </div>
        <span className="minotaur-demo-badge">SIMULATED POLICY / R3</span>
      </div>
      <div className="minotaur-panel">
        <div className="minotaur-overview">
          <div>
            <span className="gauntlet-kicker">MINOTAUR · DEFENSE-IN-DEPTH LABORATORY</span>
            <h3>Authority narrows.<br/><span>Never silently expands.</span></h3>
            <p>A reproducible seven-state demonstration of progressive capability withdrawal. Advance through suspicious events, inspect the decision trace, and verify that synthetic tool permissions are never restored within a training session.</p>
            <div className="minotaur-warning"><strong>IMPORTANT:</strong> Labels like SANDBOX, DECOY, and ISOLATE describe <em>simulated policy states</em>. The browser does not isolate real processes, redirect attackers, or constrain deployed AI agents. A separate optional local Docker smoke test checks basic container settings using a harmless bundled fixture.</div>
          </div>
          <div className="minotaur-current">
            <span>CURRENT SIMULATED TIER</span>
            <strong>{tier.name}</strong>
            <small>LEVEL {state.level} / {MINOTAUR_LEVELS.length - 1}</small>
            <div className="minotaur-meter" aria-label={`Tier level ${state.level} out of 6`}>{MINOTAUR_LEVELS.map(level => <span key={level.name} className={level.tier <= state.level ? 'filled' : ''} />)}</div>
            <p>{tier.description}</p>
          </div>
        </div>

        <div className="minotaur-ladder" role="list" aria-label="Progressively restricted simulated states">
          {MINOTAUR_LEVELS.map(level => (
            <div className={`minotaur-tier ${level.tier === state.level ? 'current' : ''} ${level.tier < state.level ? 'crossed' : ''}`} key={level.name} role="listitem">
              <span className="minotaur-tier-number">0{level.tier}</span>
              <b>{level.name}</b>
              <small>{level.capabilities.length} fixture capability{level.capabilities.length === 1 ? '' : 'ies'}</small>
            </div>
          ))}
        </div>

        <div className="minotaur-controls">
          <div>
            <span className="minotaur-section-label">SIMULATED INCIDENT INPUT</span>
            <p>{remaining > 0 ? MINOTAUR_EVENTS[eventCursor].explanation : 'Training terminal reached. Reset explicitly to begin a fresh local session.'}</p>
          </div>
          <div className="minotaur-buttons">
            <button className="gauntlet-run" disabled={remaining === 0} onClick={advance} type="button">{remaining > 0 ? 'TRIGGER NEXT EVENT' : 'TERMINAL REACHED'} ↗</button>
            <button className="minotaur-secondary" type="button" onClick={fullRun}>RUN ALL SIX</button>
            <button className="minotaur-secondary" type="button" onClick={reset}>RESET LAB</button>
          </div>
        </div>

        <div className="minotaur-lower">
          <div className="minotaur-capabilities">
            <span className="minotaur-section-label">EFFECTIVE FIXTURE PERMISSIONS</span>
            <p>These are decision labels only. Even an ALLOW outcome never executes a tool.</p>
            <div className="minotaur-cap-grid">
              {availableChecks.map(cap => {
                const result = checkSyntheticCapability(state, cap)
                return <div className="minotaur-cap" key={cap}><b>{cap.toUpperCase()}</b><span className={result.decision === 'DENY' ? 'no' : 'yes'}>{result.decision === 'DENY' ? 'DENY' : 'FIXTURE ALLOW'}</span></div>
              })}
            </div>
            <div className="minotaur-checker">
              <label htmlFor="minotaur-action">Test a simulated capability decision</label>
              <div>
                <select id="minotaur-action" value={capability} onChange={event => setCapability(event.target.value as MinotaurCapability)}>{availableChecks.map(cap => <option key={cap} value={cap}>{cap}</option>)}</select>
                <button type="button" onClick={checkCapability}>CHECK / NO EXECUTION</button>
              </div>
              <div className="minotaur-checklog" aria-live="polite">
                {checkLog.length === 0 ? <span>No capability queries yet.</span> : checkLog.map((result, index) => <span key={index}><b>{result.tier}</b> / {result.capability} : <strong className={result.decision === 'DENY' ? 'no' : 'yes'}>{result.decision}</strong> · executed=false</span>)}
              </div>
            </div>
          </div>
          <div className="minotaur-history">
            <span className="minotaur-section-label">TRANSITION LEDGER</span>
            <p>Escalation decisions remain within this page. This is not a signed or persistent audit trail.</p>
            <div className="minotaur-history-list" aria-live="polite">
              {recent.length === 0 ? <div className="minotaur-empty">No synthetic incidents in this session.</div> : recent.map(entry => (
                <div className="minotaur-history-row" key={entry.sequence}>
                  <span className="minotaur-history-seq">#{String(entry.sequence).padStart(2, '0')}</span>
                  <div><b>{entry.from} → {entry.to}</b><small>{entry.eventLabel}</small></div>
                  <span className="minotaur-history-decision">{entry.decision === 'ESCALATED' ? 'RESTRICTED' : 'TERMINAL'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="minotaur-footer">
          <div>
            <strong>RECEIPT STATUS: UNSIGNED SIMULATION</strong>
            <p>Container runtime checks require a separately authorized, opt-in local command. No Docker or backend execution is possible from this site.</p>
          </div>
          <button type="button" className="gauntlet-export" onClick={exportObservation}>EXPORT SIMULATION ↓</button>
        </div>
      </div>
    </section>
  )
}
