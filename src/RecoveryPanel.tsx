import {useState,type ChangeEvent,type FormEvent} from 'react'
import {createDraft,inspectDraft,type RecoveryFields,type RecoveryProposal,type IncidentState} from './lib/recovery'

function starting():RecoveryFields{
 const now=new Date()
 return {
  incident_id:'',incident_state:'REVIEW_REQUIRED',incident_run_id:'',
  incident_commit:'',incident_manifest_sha256:'',
  candidate_commit:'',candidate_manifest_sha256:'',
  reason:'',risk_and_impact:'',
  prepared_at:now.toISOString(),
  review_deadline:new Date(now.getTime()+24*3600*1000).toISOString(),
 }
}
const labels=[
 {key:'incident_id',label:'R11 incident packet ID',placeholder:'WHL-R11- + 20 hex characters',hint:'Read from the retained R11 incident-report.json'},
 {key:'incident_run_id',label:'Original GitHub Actions run number',placeholder:'Exact numeric run ID',hint:'The failing or unassessed post-deploy workflow'},
 {key:'incident_commit',label:'Incident source commit (40 hex)',placeholder:'Full SHA-1 commit, not a branch name',hint:'From the R11 incident packet'},
 {key:'incident_manifest_sha256',label:'Incident manifest SHA-256 (64 hex)',placeholder:'Exact build manifest SHA-256',hint:'From R11 incident packet'},
 {key:'candidate_commit',label:'Candidate recovery commit (40 hex)',placeholder:'Different full commit SHA',hint:'Operator-proposed reference; not yet verified as deployable'},
 {key:'candidate_manifest_sha256',label:'Candidate build manifest SHA-256 (64 hex)',placeholder:'Independently check this digest',hint:'Not accepted as externally verified by this form'},
] as const
type TextField=(typeof labels)[number]['key']
export default function RecoveryPanel(){
 const [fields,setFields]=useState<RecoveryFields>(starting)
 const [draft,setDraft]=useState<RecoveryProposal|null>(null)
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(false)
 const [verifyResult,setVerifyResult]=useState('')
 function change(key:TextField,value:string){
  setDraft(null)
  setVerifyResult('')
  setFields(current=>({...current,[key]:value.trim()}))
 }
 function editDescription(key:'reason'|'risk_and_impact',value:string){
  setDraft(null)
  setVerifyResult('')
  setFields(current=>({...current,[key]:value}))
 }
 async function build(event:FormEvent<HTMLFormElement>){
  event.preventDefault()
  if(busy)return
  setBusy(true)
  setError('')
  setVerifyResult('')
  try{
   const normalized={
     ...fields,incident_id:fields.incident_id.trim(),incident_run_id:fields.incident_run_id.trim(),
     incident_commit:fields.incident_commit.trim(),incident_manifest_sha256:fields.incident_manifest_sha256.trim(),
     candidate_commit:fields.candidate_commit.trim(),candidate_manifest_sha256:fields.candidate_manifest_sha256.trim(),
   }
   const prepared=await createDraft(normalized)
   const check=await inspectDraft(prepared,new Date())
   if(check.status!=='DRAFT_INTEGRITY_MATCH')throw new Error(check.reason)
   setDraft(prepared)
   setVerifyResult('Locally self-consistent draft. Owner approval NOT granted.')
  }catch(e){setError(e instanceof Error?e.message:'Draft not created')}
  finally{setBusy(false)}
 }
 async function checkImported(event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0]
  event.target.value=''
  if(!file)return
  setDraft(null)
  setError('')
  setVerifyResult('')
  if(file.size>8192){setError('8 KB limit exceeded');return}
  setBusy(true)
  try{
   const json:unknown=JSON.parse(await file.text())
   const verdict=await inspectDraft(json,new Date())
   setVerifyResult(verdict.status==='DRAFT_INTEGRITY_MATCH'?
     'Draft digest matches. This is UNSIGNED and authorizes no action.':
     'REJECTED: '+verdict.reason)
  }catch(e){setError(e instanceof Error?e.message:'Invalid JSON')}
  finally{setBusy(false)}
 }
 function exportDraft(){
  if(!draft)return
  const blob=new Blob([JSON.stringify(draft,null,2)+'\n'],{type:'application/json'})
  const url=URL.createObjectURL(blob)
  const link=document.createElement('a')
  link.href=url
  link.download=draft.proposal_id.toLowerCase()+'.json'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
 }
 return <section className="recovery-section" aria-labelledby="recovery-title">
  <div className="panel-heading">
   <div><span className="section-index">14 / RECOVERY AUTHORITY · R12</span><h2 id="recovery-title">The proposal forge</h2></div>
   <span className="recovery-badge">DRAFT ONLY · NO PERMISSION</span>
  </div>
  <div className="recovery-shell">
   <div className="recovery-header">
    <div>
     <span className="gauntlet-kicker">FIXED SOURCE COMMIT · EXPLICIT REVIEW · NO AUTOMATIC CHANGE</span>
     <h3>A proposal isn't<br/><span>permission to deploy.</span></h3>
     <p>Prepare a recovery-review packet tied to a specific R11 incident and to an exact candidate build. It includes a reproducible SHA-256 fingerprint, a review deadline and an explicit denial of deployment authority.</p>
    </div>
    <div className="recovery-guard">
     <span>AUTHORITY GATE</span>
     <strong>NOT AUTHORIZED</strong>
     <div><span>OWNER SIGNATURE</span><b>NONE</b></div>
     <div><span>CANDIDATE PROVENANCE</span><b>UNVERIFIED INPUT</b></div>
     <div><span>ACTION EXECUTION</span><b>DISABLED</b></div>
     <small>Browser-only drafts cannot approve themselves. No GitHub write token, release execution, rollback, or private key is present.</small>
    </div>
   </div>
   <div className="recovery-warning"><strong>REVIEW STUDIO ONLY.</strong> Enter reference values from actual retained R11 evidence, then independently verify the candidate build outside this page. SHA-256 detects edits relative to a draft, but anyone can recompute the hash. Never mistake a matching digest for an authenticated owner signature.</div>
   <form className="recovery-form" onSubmit={event=>void build(event)}>
    <div className="recovery-form-heading"><span className="minotaur-section-label">SCOPED INCIDENT AND IMMUTABLE CANDIDATE</span><p>Repository is fixed to MichaelWave369/WhiteHatLedger369. Branch names are not accepted as release identifiers.</p></div>
    <div className="recovery-fields">
     <label><span>Incident classification</span>
      <select value={fields.incident_state} onChange={event=>{
        setDraft(null)
        setFields(x=>({...x,incident_state:event.target.value as IncidentState}))
      }}>
       <option value="REVIEW_REQUIRED">REVIEW REQUIRED</option>
       <option value="UNASSESSED">UNASSESSED / missing evidence</option>
      </select>
      <small>A successful custody run does not require a recovery proposal</small>
     </label>
     {labels.map(item=><label key={item.key}>
      <span>{item.label}</span>
      <input value={fields[item.key]} onChange={event=>change(item.key,event.target.value)}
       placeholder={item.placeholder} spellCheck={false} autoComplete="off" maxLength={128}/>
      <small>{item.hint}</small>
     </label>)}
    </div>
    <div className="recovery-textarea">
     <label><span>Reason to request recovery review</span>
      <textarea rows={3} value={fields.reason} maxLength={500} onChange={e=>editDescription('reason',e.target.value)} placeholder="Minimum 12 characters. Describe observed evidence, not assumed exploitation."/>
     </label>
     <label><span>Risk assessment and user impact</span>
      <textarea rows={3} value={fields.risk_and_impact} maxLength={500} onChange={e=>editDescription('risk_and_impact',e.target.value)} placeholder="Minimum 12 characters. Note trade-offs, rollback impact and potential data loss."/>
     </label>
    </div>
    <p className="recovery-time">Proposal prepared: {new Date(fields.prepared_at).toLocaleString()} · Review deadline: {new Date(fields.review_deadline).toLocaleString()} (24-hour initial review window, not an authorization lease).</p>
    <div className="recovery-actions">
      <button type="submit" className="gauntlet-run" disabled={busy}>{busy?'CHECKING…':'CREATE UNSIGNED REVIEW DRAFT'} ↗</button>
      <button type="button" className="minotaur-secondary" onClick={()=>{
        setFields(starting());setDraft(null);setError('');setVerifyResult('')
      }}>CLEAR INPUTS</button>
    </div>
   </form>
   <div className="recovery-output" aria-live="polite">
    {error&&<div className="feedback error" role="alert">{error}. No authority was issued.</div>}
    {draft&&<div className="recovery-created">
     <span className="minotaur-section-label">LOCAL DRAFT COMMITMENT</span>
     <h4>{draft.proposal_id}</h4>
     <p>SHA-256 · {draft.payload_sha256}</p>
     <div><span>APPROVAL</span><strong>NOT GRANTED</strong></div>
     <div><span>EXECUTION</span><strong>DISABLED</strong></div>
     <div><span>REVIEW CANDIDATE</span><strong>{draft.candidate_commit.slice(0,12)}…</strong></div>
     <button type="button" onClick={exportDraft}>EXPORT UNSIGNED JSON ↓</button>
    </div>}
    {verifyResult&&<div className="recovery-feedback" role="status">{verifyResult}</div>}
    <div className="recovery-verify">
     <div><strong>VERIFY A SAVED DRAFT</strong><p>Open a local R12 JSON packet and check its self-consistency and deadline. No data is uploaded. No authority is issued.</p></div>
     <label className="recovery-local-input">CHECK LOCAL JSON…
      <input type="file" accept=".json,application/json" onChange={event=>void checkImported(event)} aria-label="Verify local recovery draft" disabled={busy}/>
     </label>
    </div>
   </div>
   <div className="recovery-footer">
    <strong>STRICT SAFETY BOUNDARY:</strong> This page does not retrieve incident packets automatically, prove the candidate was previously deployed, validate owner identity or sign approvals. Future recovery execution needs a separate consent-checked, tamper-evident gateway and independent operator review. No production rollback workflow exists in R12.
    <p><a href="https://github.com/MichaelWave369/WhiteHatLedger369/blob/main/docs/RECOVERY.md" target="_blank" rel="noopener noreferrer">READ R12 POLICY ↗</a></p>
   </div>
  </div>
 </section>
}
