import {useEffect,useState} from 'react'
import {
 fetchGuardian, guardianIsStale,simulatePolicy,
 type DemoMode,type GuardianReport,type GuardStatus,
} from './lib/guardian'

const modes:{id:DemoMode;label:string;caption:string}[]=[
 {id:'all-pass',label:'All evidence present',caption:'A toy-only complete PASS'},
 {id:'unknown',label:'One missing receipt',caption:'A missing proof stays UNKNOWN'},
 {id:'fail',label:'One failed control',caption:'FAIL dominates the decision'},
]
const icons:Record<GuardStatus,string>={PASS:'✓',FAIL:'!',UNKNOWN:'?'}

export default function GuardianPanel(){
 const [report,setReport]=useState<GuardianReport|null>(null)
 const [error,setError]=useState('')
 const [loading,setLoading]=useState(true)
 const [demoMode,setDemoMode]=useState<DemoMode>('unknown')
 const simulation=simulatePolicy(demoMode)
 useEffect(()=>{
   const ctrl=new AbortController()
   void fetchGuardian(ctrl.signal).then(value=>{
     if(!ctrl.signal.aborted)setReport(value)
   }).catch((cause:unknown)=>{
     if(!ctrl.signal.aborted)setError(cause instanceof Error?cause.message:'Unable to verify guardian data')
   }).finally(()=>{if(!ctrl.signal.aborted)setLoading(false)})
   return ()=>ctrl.abort()
 },[])
 const stale=report?guardianIsStale(report):true
 const status:GuardStatus=report&&!stale?report.production_release.status:'UNKNOWN'
 const controls=report?.controls??[]
 return (
  <section className="guardian-section" aria-labelledby="guardian-title">
   <div className="panel-heading">
    <div><span className="section-index">08 / RELEASE GUARDIAN · R6</span><h2 id="guardian-title">The decision chamber</h2></div>
    <span className="guardian-badge">ADVISORY ONLY / NOT BLOCKING</span>
   </div>
   <div className="guardian-shell">
    <div className="guardian-hero">
     <div>
      <span className="gauntlet-kicker">EVIDENCE FIRST · FAIL CLOSED</span>
      <h3>Three outcomes.<br/><span>No invented certainty.</span></h3>
      <p>Release Guardian evaluates what WhiteHatLedger369 can actually establish. A narrow npm advisory result can be evaluated, but missing supply-chain proof, build attestations, signed consent, and real patch/retest evidence stay UNKNOWN.</p>
      <p className="guardian-meta">GitHub Actions generates this unsigned, public policy report. Its output does not attest the CI runner or authorize a release.</p>
     </div>
     <div className="guardian-current" aria-live="polite">
      <span>PRODUCTION RELEASE POSTURE</span>
      <strong className={`guardian-status-${status.toLowerCase()}`}>{status}</strong>
      <div className="guardian-signal"><span>POLICY MODE</span><b>ADVISORY ONLY</b></div>
      <div className="guardian-signal"><span>DEPLOY BLOCKING</span><b>DISABLED</b></div>
      <div className="guardian-signal"><span>REPORT FRESHNESS</span><b>{loading?'LOADING':stale?'STALE / NOT GENERATED':'WITHIN 48H'}</b></div>
      <small>{report?.generated_at?new Date(report.generated_at).toLocaleString():'No evaluated report published yet.'}</small>
     </div>
    </div>
    {error&&<div className="feedback error" role="alert">{error}. No release approval may be inferred.</div>}
    <div className="guardian-warning"><strong>NO PRODUCTION RELEASE IS CERTIFIED.</strong> {report&&!stale?report.production_release.detail:'No fresh, validated report is available. The release posture is UNKNOWN.'} A signed synthetic R5 fixture can prove only the integrity of its example bytes, never real deployment security.</div>
    <div className="guardian-checks">
      <span className="minotaur-section-label">LIVE POLICY EVALUATION / REQUIRED CONTROLS</span>
      {controls.length>0?controls.map(check=>
        <article className="guardian-check" key={check.id}>
          <span className={`guardian-indicator ${stale?'unknown':check.status.toLowerCase()}`}>{stale?'?':icons[check.status]}</span>
          <div>
            <strong>{check.label}</strong>
            <p>{stale?'Report is stale; re-evaluation required.':check.detail}</p>
            <small>{check.scope}</small>
          </div>
          <span className={`guardian-check-state ${stale?'unknown':check.status.toLowerCase()}`}>{stale?'UNKNOWN':check.status}</span>
        </article>
      ):<div className="guardian-missing">No evaluated release controls in the checked-in placeholder. GitHub Pages must run the Guardian generator after Sentinel.</div>}
    </div>
    <div className="guardian-demo">
      <div className="guardian-demo-heading">
        <div>
         <span className="minotaur-section-label">ISOLATED POLICY TRAINING AREA</span>
         <h4>Test the decision rule</h4>
         <p>This separate synthetic panel does not change the release posture above.</p>
        </div>
        <span className={`guardian-training-label ${simulation.status.toLowerCase()}`}>TOY RESULT: {simulation.status}</span>
      </div>
      <div className="guardian-demo-modes">
        {modes.map(m=><button type="button" key={m.id} className={demoMode===m.id?'guardian-demo-mode selected':'guardian-demo-mode'} aria-pressed={demoMode===m.id} onClick={()=>setDemoMode(m.id)}><strong>{m.label}</strong><small>{m.caption}</small></button>)}
      </div>
      <div className="guardian-sim-signals">
        {simulation.input.map((value,index)=><div key={index}><span>SYNTHETIC CONTROL {index+1}</span><strong className={value.toLowerCase()}>{value}</strong></div>)}
      </div>
      <p className="guardian-toy-caption">{simulation.note}</p>
    </div>
    <div className="guardian-footer">
      <div>
        <strong>R5 SIGNED SAMPLE: {report&&!stale?report.demonstration.status:'UNKNOWN'}</strong>
        <p>Excluded from production release decisions. Policy output is unsigned and advisory; no live build is blocked, approved, or certified.</p>
      </div>
      <a href="https://github.com/MichaelWave369/WhiteHatLedger369/blob/main/docs/GUARDIAN.md" target="_blank" rel="noopener noreferrer">READ POLICY SPEC ↗</a>
    </div>
   </div>
  </section>
 )
}
