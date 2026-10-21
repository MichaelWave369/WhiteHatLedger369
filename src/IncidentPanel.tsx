import {useEffect,useState} from 'react'

interface PublicRun {id:number;name:string;status:string;conclusion:string|null;html_url:string;head_sha:string;created_at:string}
interface PublicJob {name:string;status:string;conclusion:string|null}
interface Observed {run:PublicRun;custody:PublicJob|null;label:'PASSED'|'REVIEW REQUIRED'|'UNASSESSED'}

const api='https://api.github.com/repos/MichaelWave369/WhiteHatLedger369/'
const expected='https://github.com/MichaelWave369/WhiteHatLedger369/actions/runs/'
const actions=[
 {id:'01',heading:'Preserve the original evidence',text:'Retain the immutable workflow URL, source commit, build manifest digest and the R11 packet. Do not overwrite the failed observation.'},
 {id:'02',heading:'Verify independently',text:'Download the live manifest. Validate its GitHub/Sigstore attestation and exact source commit, then compare served asset hashes.'},
 {id:'03',heading:'Diagnose before intervention',text:'Distinguish a CDN propagation delay, missing static file, source mismatch and unauthorized modification. A red job is not proof of an attack.'},
 {id:'04',heading:'Obtain operator approval',text:'Only the asset owner may approve a corrective deployment, rollback or credential change. No automatic mutating operation is wired up.'},
 {id:'05',heading:'Retest without erasing history',text:'A new passing deployment adds evidence for that build. It does not silently close or delete a previous incident record.'},
] as const
function safeRunURL(url:string){
 try{
  const parsed=new URL(url)
  return parsed.protocol==='https:'&&parsed.origin==='https://github.com'&&
    parsed.href.startsWith(expected)?parsed.href:null
 }catch{return null}
}
async function requestJSON(uri:string,signal:AbortSignal):Promise<unknown>{
 const response=await fetch(uri,{signal,cache:'no-store',headers:{Accept:'application/vnd.github+json'}})
 if(!response.ok)throw new Error('GitHub API returned '+response.status)
 return response.json() as Promise<unknown>
}
export default function IncidentPanel(){
 const [reports,setReports]=useState<Observed[]>([])
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 useEffect(()=>{
  const controller=new AbortController()
  const run=async()=>{
   const raw=await requestJSON(api+'actions/workflows/pages.yml/runs?branch=main&per_page=4',controller.signal)
   if(!raw||typeof raw!=='object'||!('workflow_runs' in raw)||!Array.isArray(raw.workflow_runs))
     throw new Error('Invalid public workflow run list')
   const runs=(raw.workflow_runs as unknown[]).filter((v):v is PublicRun=>
     !!v&&typeof v==='object'&&
     Number.isSafeInteger((v as PublicRun).id)&&
     typeof (v as PublicRun).html_url==='string'&&
     safeRunURL((v as PublicRun).html_url)!==null).slice(0,4)
   const observed:Observed[]=await Promise.all(runs.map(async run=>{
     const rawJobs=await requestJSON(api+'actions/runs/'+run.id+'/jobs?per_page=40',controller.signal)
     if(!rawJobs||typeof rawJobs!=='object'||!('jobs' in rawJobs)||!Array.isArray(rawJobs.jobs))
       throw new Error('Job metadata missing for one or more workflow runs')
     const jobs=rawJobs.jobs as PublicJob[]
     const custody=jobs.find(j=>j&&j.name==='Post-deploy public chain of custody')??null
     const label=run.status==='completed'&&run.conclusion==='success'&&custody?.conclusion==='success'
       ?'PASSED':custody?.conclusion==='failure'?'REVIEW REQUIRED':'UNASSESSED'
     return {run,custody,label}
   }))
   if(!controller.signal.aborted)setReports(observed)
  }
  void run().catch((e:unknown)=>{
    if(!controller.signal.aborted)setError(e instanceof Error?e.message:'GitHub evidence unavailable')
  }).finally(()=>{if(!controller.signal.aborted)setLoading(false)})
  return ()=>controller.abort()
 },[])
 const latest=reports[0]
 const review=reports.filter(r=>r.label==='REVIEW REQUIRED').length
 const absent=reports.filter(r=>r.label==='UNASSESSED').length
 const label=latest?.label??'UNASSESSED'
 return <section className="incident-section" aria-labelledby="incident-title">
  <div className="panel-heading">
   <div><span className="section-index">13 / INCIDENT DESK · R11</span><h2 id="incident-title">The recovery ledger</h2></div>
   <span className="incident-badge">EVIDENCE / HUMAN CONTROL</span>
  </div>
  <div className="incident-shell">
   <div className="incident-header">
    <div>
     <span className="gauntlet-kicker">RECONCILIATION FAILURE → TRIAGE → OPERATOR-APPROVED RECOVERY</span>
     <h3>Never erase a failure.<br/><span>Never invent a recovery.</span></h3>
     <p>R11 writes an incident packet alongside every R10 post-deployment custody observation, including missing or failed verification. Its evidence-preserving recovery checklist is read-only and does not launch rollbacks or modify GitHub.</p>
     <p className="incident-subtext">This public display reads recent GitHub Actions results. Its statuses reflect public workflow/job metadata, not independently verified incident-report content or a live security assessment.</p>
    </div>
    <div className="incident-status">
     <span>LATEST PUBLIC WORKFLOW OBSERVATION</span>
     <strong className={label==='PASSED'?'incident-green':label==='REVIEW REQUIRED'?'incident-red':'incident-gold'}>{loading?'LOADING':label}</strong>
     <div><span>RUNS INSPECTED</span><b>{loading?'—':reports.length}</b></div>
     <div><span>JOB FAILURES</span><b>{review}</b></div>
     <div><span>UNASSESSED</span><b>{absent}</b></div>
     <small>Historical results are not equivalent to a persistent, independently signed incident database.</small>
    </div>
   </div>
   <div className="incident-warning">
    <strong>RECOVERY IS NEVER AUTOMATIC.</strong> A custody mismatch is evidence to investigate, not proof of exploitation. A post-deploy failure is recorded <em>after the site may already be live</em>. R11 generates advisory packets, retains the original run and requires explicit owner authorization before any recovery action.
   </div>
   <div className="incident-history">
    <div className="gauntlet-list-heading">RECENT PUBLIC DEPLOYMENT RUNS <span>LAST FOUR · READ ONLY</span></div>
    {error&&<div className="feedback error" role="alert">{error}. Incident state remains UNASSESSED.</div>}
    {!loading&&reports.length===0&&<p className="incident-empty">No verified GitHub run metadata available. Do not infer that no incident exists.</p>}
    {reports.map(item=><article className="incident-run" key={item.run.id}>
      <div>
       <span>RUN #{item.run.id} · {item.run.head_sha?.slice(0,12)||'COMMIT UNKNOWN'}</span>
       <strong className={item.label==='PASSED'?'incident-green':item.label==='REVIEW REQUIRED'?'incident-red':'incident-gold'}>{item.label}</strong>
       <p>{item.label==='PASSED'?'The custody job reported successful attestation and published-byte checks for this run. Not a security certification.':
         item.label==='REVIEW REQUIRED'?'The custody job failed. Inspect the original workflow and R11 packet; the site may already have been published.':
         'This workflow has no completed successful custody observation. Missing data never means clean.'}</p>
      </div>
      {safeRunURL(item.run.html_url)&&<a href={item.run.html_url} target="_blank" rel="noopener noreferrer">OPEN RUN ↗</a>}
    </article>)}
   </div>
   <div className="incident-recovery">
    <div><span className="minotaur-section-label">SAFE RESPONSE PLAYBOOK</span><h4>Five steps to accountable recovery</h4><p>Operator actions, not automated commands. Each decision should earn its own receipt.</p></div>
    <div className="incident-steps">{actions.map(step=><article key={step.id}>
      <span>{step.id}</span><div><strong>{step.heading}</strong><p>{step.text}</p></div>
    </article>)}</div>
   </div>
   <footer className="incident-footer">
    <div><strong>NO ISSUES CREATED · NO ROLLBACK · NO SECRETS TOUCHED</strong><p>Unsigned incident packets are retained with their workflow for 30 days. Closed status requires separate human review; a later green run does not erase earlier evidence.</p></div>
    <a href="https://github.com/MichaelWave369/WhiteHatLedger369/blob/main/docs/INCIDENT.md" target="_blank" rel="noopener noreferrer">READ INCIDENT PROTOCOL ↗</a>
   </footer>
  </div>
 </section>
}
