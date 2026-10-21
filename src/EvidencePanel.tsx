import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  DEMO_LEDGER_ID, DEMO_ISSUER, PINNED_PUBLIC_KEY, verifyEvidenceLedger,
  withEvidenceTamper, inspectEvidenceShape,
  type EvidenceLedger, type EvidenceVerification, type TamperCase,
} from './lib/evidence'

const scenarios: { id: TamperCase; title: string; description: string }[] = [
  { id:'clean', title:'Original signed sample', description:'Verify the pinned public key, hash chain, and checkpoint.' },
  { id:'alter-summary', title:'Tamper with evidence', description:'Change the meaning of one observation without updating its hash.' },
  { id:'remove-record', title:'Delete an entry', description:'Omit one synthetic receipt from the signed chain.' },
  { id:'swap-records', title:'Reorder the chain', description:'Swap two receipts so sequence and previous hashes cannot match.' },
  { id:'forge-checkpoint', title:'Forge the signed head', description:'Alter the purported chain commitment, without its signing key.' },
]

export default function EvidencePanel() {
  const [fixture,setFixture]=useState<EvidenceLedger|null>(null)
  const [active,setActive]=useState<TamperCase>('clean')
  const [report,setReport]=useState<EvidenceVerification|null>(null)
  const [observed,setObserved]=useState<EvidenceLedger|null>(null)
  const [error,setError]=useState('')
  const [source,setSource]=useState('Bundled sample')
  const [busy,setBusy]=useState(false)
  const fileRef=useRef<HTMLInputElement|null>(null)

  const loadFixture=useCallback(async(signal?: AbortSignal)=>{
    const res=await fetch(`${import.meta.env.BASE_URL}evidence-ledger.json`,{
      credentials:'omit', cache:'no-store', signal,
    })
    if(!res.ok)throw new Error('Bundled R5 fixture could not be loaded.')
    const json: unknown=await res.json()
    if(!inspectEvidenceShape(json))throw new Error('Bundled R5 fixture has invalid structure.')
    return json
  },[])

  useEffect(()=>{
    const controller=new AbortController()
    void loadFixture(controller.signal).then(sample=>{
      if(controller.signal.aborted)return
      setFixture(sample)
      setObserved(sample)
      void verifyEvidenceLedger(sample).then(result=>{
        if(!controller.signal.aborted)setReport(result)
      })
    }).catch((e:unknown)=>{
      if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Unable to load evidence sample')
    })
    return ()=>controller.abort()
  },[loadFixture])

  async function runScenario(id: TamperCase){
    if(!fixture)return
    setActive(id)
    setBusy(true)
    setError('')
    setSource(id==='clean'?'Bundled sample':'Locally modified sample')
    try{
      const candidate=withEvidenceTamper(fixture,id)
      setObserved(candidate)
      setReport(await verifyEvidenceLedger(candidate))
    }catch(e){
      setError(e instanceof Error?e.message:'Verification unavailable')
      setReport(null)
    }finally{setBusy(false)}
  }

  async function importLocal(event: ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0]
    if(!file)return
    event.target.value=''
    setActive('clean')
    setBusy(true)
    setError('')
    setReport(null)
    setSource('Local file: '+file.name.slice(0,75))
    try{
      if(file.size>65536)throw new Error('64 KB maximum; local file not read.')
      const data: unknown=JSON.parse(await file.text())
      if(!inspectEvidenceShape(data)){
        setObserved(null)
        setReport(await verifyEvidenceLedger(data))
      } else {
        setObserved(data)
        setReport(await verifyEvidenceLedger(data))
      }
    }catch(e){setObserved(null);setError(e instanceof Error?e.message:'Unable to read file')}
    finally{setBusy(false)}
  }

  function exportLocal(){
    if(!observed)return
    const url=URL.createObjectURL(new Blob([JSON.stringify(observed,null,2)+'\n'],{type:'application/json'}))
    const a=document.createElement('a')
    a.href=url
    a.download='whitehat369-r5-synthetic-evidence.json'
    document.body.append(a)
    a.click()
    a.remove()
    window.setTimeout(()=>URL.revokeObjectURL(url),1000)
  }

  const verified=report?.status==='VERIFIED_SAMPLE'
  const rejected=report?.status==='REJECTED'
  const status=busy?'VERIFYING':!report?'UNKNOWN':verified?'PINNED SAMPLE VERIFIED':rejected?'EVIDENCE REJECTED':'CRYPTO UNAVAILABLE'

  return (
    <section className="evidence-section" aria-labelledby="evidence-title">
      <div className="panel-heading">
        <div><span className="section-index">07 / EVIDENCE LEDGER · R5</span><h2 id="evidence-title">The proof archive</h2></div>
        <span className="evidence-label">SIGNED SAMPLE / ED25519</span>
      </div>
      <div className="evidence-shell">
        <div className="evidence-hero">
          <div>
            <span className="gauntlet-kicker">TAMPER-EVIDENT · PUBLIC-KEY VERIFIED</span>
            <h3>Receipts linked.<br/><span>Claims challenged.</span></h3>
            <p>Each synthetic receipt commits to its contents and the previous receipt's hash. A signed checkpoint commits to the final head. Your browser checks the chain against a separately pinned public demonstration key.</p>
            <div className="evidence-actions">
              <button type="button" className="gauntlet-run" onClick={()=>void runScenario('clean')} disabled={busy||!fixture}>VERIFY SIGNED SAMPLE ↗</button>
              <button type="button" className="minotaur-secondary" disabled={busy} onClick={()=>fileRef.current?.click()}>VERIFY LOCAL JSON…</button>
              <input ref={fileRef} type="file" accept=".json,application/json" hidden aria-label="Select local JSON evidence receipt" onChange={event=>void importLocal(event)} />
            </div>
            <p className="evidence-hint">Local JSON is verified in your browser, never uploaded. Only the bundled demo issuer, subject, and trust anchor are accepted. Maximum 64 KB.</p>
          </div>
          <div className="evidence-state">
            <span>INDEPENDENT VERIFICATION</span>
            <strong className={verified?'is-good':rejected?'is-bad':'is-unknown'}>{status}</strong>
            <div><span>HASH CHAIN</span><b>{report ? (report.chainValid?'MATCH':'BROKEN / UNPROVEN'):'UNKNOWN'}</b></div>
            <div><span>SIGNED CHECKPOINT</span><b>{report ? (report.signatureValid?'VALID':'INVALID / UNAVAILABLE'):'UNKNOWN'}</b></div>
            <div><span>RECORDS CHECKED</span><b>{report?.inspected.length ?? '—'}</b></div>
            <small>{source}</small>
          </div>
        </div>
        <div className="evidence-warning">
          <strong>IMPORTANT: THIS VERIFIES A FROZEN SYNTHETIC SAMPLE, NOT REAL-WORLD SECURITY.</strong>
          <p>The sample was generated from an ephemeral signing key. The public verification key is pinned in source. An attacker controlling this website could also change that trust anchor. Real security receipts require independently distributed trust roots and protected signing keys.</p>
        </div>
        <div className="evidence-workbench">
          <div className="evidence-choices">
            <div className="gauntlet-list-heading">TAMPER EXERCISES <span>5 MODES</span></div>
            {scenarios.map((item,i)=>(
              <button type="button" key={item.id} className={active===item.id?'evidence-choice active':'evidence-choice'}
                onClick={()=>void runScenario(item.id)} disabled={!fixture||busy} aria-pressed={active===item.id}>
                <span>{String(i+1).padStart(2,'0')}</span>
                <div><b>{item.title}</b><small>{item.description}</small></div>
              </button>
            ))}
          </div>
          <div className="evidence-inspector">
            <span className="minotaur-section-label">RECORDS / CUSTODY INSPECTION</span>
            <div className="evidence-identity">
              <span>LEDGER <b>{DEMO_LEDGER_ID}</b></span>
              <span>ISSUER <b>{DEMO_ISSUER}</b></span>
              <span>PINNED KEY <b>{PINNED_PUBLIC_KEY.slice(0,15)}…</b></span>
            </div>
            {observed ? (
              <div className="evidence-list">
                {observed.records.map((rec,i)=>{
                  const inspection=report?.inspected.find((entry,index)=>index===i&&entry.sequence===rec.sequence)
                  return <article className="evidence-entry" key={i}>
                    <div className="evidence-entry-top"><span>#{rec.sequence} · {rec.kind}</span><strong className={inspection?.integrity==='MATCH'?'evidence-match':inspection?.integrity==='BROKEN'?'evidence-fail':''}>{inspection?.integrity ?? 'UNKNOWN'}</strong></div>
                    <p>{rec.summary}</p>
                    <code>{rec.hash.slice(0,20)}…</code>
                  </article>
                })}
              </div>
            ):<div className="authority-empty">Unable to parse a supported sample ledger.</div>}
            {report && <div className={verified?'evidence-outcome pass':'evidence-outcome fail'} role="status">
              <strong>{status}</strong>
              <p>Reason: {report.reason}. Signed sample claim status: {report.claimsVerified?'verified against compiled trust anchor':'not verified'}.</p>
            </div>}
            {error && <div className="feedback error" role="alert">{error}</div>}
            <button type="button" className="gauntlet-export" disabled={!observed||busy} onClick={exportLocal}>EXPORT VISIBLE JSON ↓</button>
          </div>
        </div>
        <div className="evidence-footer">
          <strong>BOUNDARY: LABORATORY ONLY.</strong> Signature and hash verification show whether this demo record matches a pinned public key and exact bytes. They do not prove the underlying statements were truthful, independently observed, authorized, or that a production patch/retest occurred. Signed records from real systems are a separate future project.
        </div>
      </div>
    </section>
  )
}
