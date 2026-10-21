import { useState } from 'react'
import {
  SCENARIOS, SIGNED_FIXTURE, TRUSTED_KEY_ID, AUTHORITY_DEMO_CLOCK,
  runAuthorityScenario, type AuthorityScenario, type ScenarioResult,
} from './lib/authority'

const present: Record<string,string> = {
 SIGNATURE_VERIFIED:'Signature valid / exact fixture scope',
 KEY_NOT_TRUSTED:'Issuer key not trusted',
 BAD_ENVELOPE:'Invalid signature envelope',
 SIGNATURE_INVALID:'Signature mismatch / altered payload',
 CRYPTO_UNAVAILABLE:'Ed25519 verification unavailable',
 CLAIMS_INVALID:'Invalid signed claim schema',
 NOT_YET_VALID:'Lease not yet active',
 EXPIRED:'Lease expired',
 AUDIENCE_MISMATCH:'Audience mismatch',
 SUBJECT_MISMATCH:'Agent identity mismatch',
 RESOURCE_MISMATCH:'Target resource mismatch',
 OPERATION_DENIED:'Operation not granted',
 REPLAY:'Nonce already consumed',
}

export default function AuthorityPanel() {
 const [results,setResults] = useState<ScenarioResult[]>([])
 const [busy,setBusy] = useState(false)
 const [error,setError] = useState('')
 const [selected,setSelected] = useState<AuthorityScenario>('valid')
 const current = results.find(r => r.scenario === selected)

 async function runOne(id: AuthorityScenario) {
   setBusy(true)
   setError('')
   try {
     const result = await runAuthorityScenario(id)
     setSelected(id)
     setResults(prev => [...prev.filter(x=>x.scenario!==id),result])
   } catch (e) {
     setError(e instanceof Error ? e.message : 'Verification unavailable')
   } finally { setBusy(false) }
 }
 async function runAll() {
   setBusy(true)
   setError('')
   setResults([])
   try {
     const all: ScenarioResult[] = []
     for(const {id} of SCENARIOS) all.push(await runAuthorityScenario(id))
     setResults(all)
     setSelected(all.find(x=>!x.matchedExpectation)?.scenario ?? 'valid')
   } catch(e) {
     setError(e instanceof Error ? e.message : 'Verification unavailable')
     setResults([])
   } finally { setBusy(false) }
 }

 const total = results.length
 const matches = results.filter(r=>r.matchedExpectation).length
 const possible = results.filter(r=>r.verdict.decision === 'ALLOW_FIXTURE_ONLY').length

 return (
  <section className="authority-section" aria-labelledby="authority-title">
   <div className="panel-heading">
     <div><span className="section-index">06 / AGENT AUTHORITY · R4</span><h2 id="authority-title">The signature gate</h2></div>
     <span className="authority-badge">ED25519 / OFFLINE FIXTURE</span>
   </div>
   <div className="authority-shell">
    <div className="authority-hero">
      <div>
       <span className="gauntlet-kicker">PROVE AUTHORITY BEFORE TRUSTING AN INSTRUCTION</span>
       <h3>Signatures don't negotiate.<br/><span>Neither should scope.</span></h3>
       <p>Verify a genuinely signed, fixed training grant with a pinned public key. Explore signature tampering, privilege escalation, wrong target, expired authority, and replay. Every result is a decision label. No real agent or tool runs.</p>
       <div className="authority-actions">
         <button type="button" onClick={() => void runAll()} disabled={busy} className="gauntlet-run">{busy?'VERIFYING…':'RUN ALL SEVEN CHECKS'} ↗</button>
         <button type="button" className="minotaur-secondary" onClick={() => {setResults([]);setError('')}} disabled={busy}>CLEAR RESULTS</button>
       </div>
      </div>
      <div className="authority-identity">
       <span>PINNED PUBLIC TRUST ANCHOR</span>
       <strong>{TRUSTED_KEY_ID}</strong>
       <code>{SIGNED_FIXTURE.signature.slice(0,19)}…</code>
       <small>Demo Ed25519 signature. Private signer key is not shipped.</small>
       <div className="authority-key-state"><span>◈ SIGNATURE</span><b>{current?.verdict.signature ?? 'NOT CHECKED'}</b></div>
       <div className="authority-key-state"><span>◈ DECISION</span><b>{current?.verdict.decision ?? 'UNKNOWN'}</b></div>
      </div>
    </div>
    <div className="authority-notice">
     <strong>FIXED DEMONSTRATION CLOCK: {AUTHORITY_DEMO_CLOCK}</strong>
     <p>This is a frozen historical test vector, not a current authorization request. The sample expires on October 22, 2026. A valid signature never extends an expired grant, and a local browser verifier cannot secure an external AI agent.</p>
    </div>
    <div className="authority-metrics">
      <div><span>SCENARIOS RUN</span><strong>{total}/7</strong></div>
      <div><span>EXPECTED OUTCOMES</span><strong>{total>0 ? matches : '—'}/{total || 7}</strong></div>
      <div><span>FIXTURE-ONLY ALLOWS</span><strong>{total?possible:'—'}</strong></div>
      <div><span>REAL TOOL EXECUTIONS</span><strong>0</strong></div>
    </div>
    <div className="authority-body">
     <div className="authority-list">
      <div className="gauntlet-list-heading">SIGNED GRANT TEST CASES <span>STATIC / OWNED</span></div>
      {SCENARIOS.map((s,i)=>{
       const result=results.find(r=>r.scenario===s.id)
       return (
        <button className={selected===s.id?'authority-case active':'authority-case'} type="button" key={s.id} aria-pressed={selected===s.id} onClick={()=>setSelected(s.id)}>
          <span>{String(i+1).padStart(2,'0')}</span>
          <div><b>{s.label}</b><small>{s.description}</small></div>
          <strong className={result?result.matchedExpectation?'authority-pass':'authority-fail':'authority-unrun'}>{result?(result.matchedExpectation?'MATCH':'FAIL'):'UNRUN'}</strong>
        </button>
       )
      })}
     </div>
     <div className="authority-inspector">
       <span className="minotaur-section-label">SIGNED FIXTURE / VERIFICATION TRACE</span>
       <h4>{SCENARIOS.find(s=>s.id===selected)?.label}</h4>
       <p>{SCENARIOS.find(s=>s.id===selected)?.description}</p>
       <div className="authority-claims">
         <div><span>ISSUER</span><strong>whitehat369-fixture-issuer</strong></div>
         <div><span>SUBJECT</span><strong>simulated-spv-agent</strong></div>
         <div><span>AUDIENCE</span><strong>whitehat369-r4-lab</strong></div>
         <div><span>TARGET</span><strong>lab://whitehat369/agent-demo</strong></div>
         <div><span>GRANTED OPERATION</span><strong>observe</strong></div>
         <div><span>LEASE</span><strong>24 hours, Oct 21–22, 2026 UTC</strong></div>
       </div>
       {current?
       <div className={current.matchedExpectation?'authority-outcome pass':'authority-outcome fail'} role="status">
        <strong>{current.matchedExpectation?'EXPECTED RESULT VERIFIED':'UNEXPECTED RESULT / INVESTIGATE'}</strong>
        <p>{present[current.verdict.reason] ?? current.verdict.reason}</p>
        <small>Signature: {current.verdict.signature} · Verdict: {current.verdict.decision} · executed=false</small>
       </div>:
       <div className="authority-empty">No evidence for this scenario yet. Run the selected case or the entire test suite.</div>}
       <button type="button" className="authority-test" onClick={() => void runOne(selected)} disabled={busy}>VERIFY SELECTED SCENARIO ↗</button>
       {error && <div className="feedback error" role="alert">{error}. No authority was granted.</div>}
     </div>
    </div>
    <footer className="authority-footer">
     <strong>SIMULATED AUTHORITY ONLY.</strong> The pinned public key and signature are fixtures. This does not mint grants, sign agent commands, store revoked nonces across sessions, bind hardware identity, or intercept SuperPhiVessel tool calls. Integration into real tools requires a separate trusted backend and explicit operator consent.
    </footer>
   </div>
  </section>
 )
}
