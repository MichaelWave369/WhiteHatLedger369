import { useEffect, useRef, useState } from 'react'
import {fetchArtifactManifest,verifyHostedFiles,type ArtifactManifest,type HostedCheck} from './lib/artifact'

export default function ArtifactPanel(){
 const [manifest,setManifest]=useState<ArtifactManifest|null>(null)
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(true)
 const [running,setRunning]=useState(false)
 const [progress,setProgress]=useState(0)
 const [check,setCheck]=useState<HostedCheck|null>(null)
 const ctrl=useRef<AbortController|null>(null)

 useEffect(()=>{
   const controller=new AbortController()
   ctrl.current=controller
   void fetchArtifactManifest(controller.signal).then(value=>{
     if(!controller.signal.aborted)setManifest(value)
   }).catch((e:unknown)=>{
     if(!controller.signal.aborted)setError(e instanceof Error?e.message:'No valid artifact manifest found')
   }).finally(()=>{
     if(!controller.signal.aborted)setBusy(false)
   })
   return ()=>controller.abort()
 },[])
 async function run(){
   if(!manifest||running)return
   setRunning(true)
   setError('')
   setProgress(0)
   setCheck(null)
   const controller=new AbortController()
   ctrl.current=controller
   try{
     setCheck(await verifyHostedFiles(manifest,controller.signal,setProgress))
   }catch(e){
     setError(e instanceof Error?e.message:'Hosted file verification unavailable')
   }finally{setRunning(false)}
 }
 const result=check?.status??'NOT CHECKED'
 return (
  <section className="artifact-section" aria-labelledby="artifact-title">
   <div className="panel-heading">
    <div><span className="section-index">10 / ARTIFACT WITNESS · R8</span><h2 id="artifact-title">The build fingerprint</h2></div>
    <span className="artifact-badge">SHA-256 / UNSIGNED</span>
   </div>
   <div className="artifact-shell">
    <div className="artifact-head">
      <div>
        <span className="gauntlet-kicker">BUILD BYTES · SOURCE BINDINGS · INTEGRITY</span>
        <h3>Inspect the output.<br/><span>Challenge the bytes.</span></h3>
        <p>GitHub Actions lists every file produced by the static build and commits to its contents with SHA-256 digests. The Node verifier checks the local build, and this browser can re-download the published assets to compare them with the site's own manifest.</p>
        <p className="artifact-fine">Same-site checks detect unexpected mismatches. They are <b>not</b> an independent third-party attestation and cannot stop a compromised host from changing both the manifest and assets.</p>
      </div>
      <div className="artifact-current" aria-live="polite">
        <span>HOSTED BYTE COMPARISON</span>
        <strong className={check?.status==='MATCH'?'artifact-match':check?.status==='MISMATCH'?'artifact-mismatch':'artifact-unknown'}>{running?'CHECKING…':result}</strong>
        <div><span>FILES CHECKED</span><b>{progress}/{manifest?.file_count??'—'}</b></div>
        <div><span>BUILD MANIFEST</span><b>{busy?'LOADING':manifest?'SELF-CONSISTENT':'UNAVAILABLE'}</b></div>
        <div><span>INDEPENDENT ATTESTATION</span><b>UNKNOWN</b></div>
        <small>{manifest?.generated_at?new Date(manifest.generated_at).toLocaleString():'No manifest observed'}</small>
      </div>
    </div>
    <div className="artifact-summary">
      <div><span>FILES DECLARED</span><strong>{manifest?.file_count??'—'}</strong></div>
      <div><span>DECLARED BYTES</span><strong>{manifest?manifest.total_bytes.toLocaleString():'—'}</strong></div>
      <div><span>LOCKFILE BINDING</span><strong>{manifest?.source.lock_sha256?'SHA-256':'UNKNOWN'}</strong></div>
      <div><span>STATUS</span><strong>{check?.status??'UNTESTED'}</strong></div>
    </div>
    <div className="artifact-note"><strong>BOUNDARY:</strong> A valid build-file digest means the bytes match the manifest you checked. The manifest and this page are served by the same party. A compromised build pipeline could fabricate both. Security conclusions still require externally verifiable provenance.</div>
    <div className="artifact-controls">
      <div><span className="minotaur-section-label">PUBLIC ARTIFACT SELF-CHECK</span><p>Fetches only this GitHub Pages site's own listed assets. No external URLs, credentials, private targets, or tool access.</p></div>
      <button type="button" className="gauntlet-run" disabled={!manifest||running||busy} onClick={()=>void run()}>{running?'COMPARING BYTES…':'VERIFY HOSTED BYTES'} ↗</button>
    </div>
    {error&&<div className="feedback error" role="alert">{error}. Do not interpret this as a clean verification.</div>}
    {check&&<div className={check.status==='MATCH'?'artifact-result ok':'artifact-result caution'} role="status">
     <strong>{check.status}: {check.checked}/{check.total} files checked</strong>
     <p>{check.reason}</p>
     {check.mismatched.length>0&&<p>Mismatches: {check.mismatched.slice(0,6).join(', ')}{check.mismatched.length>6?' …':''}</p>}
    </div>}
    <div className="artifact-files">
      <div className="gauntlet-list-heading">STATIC BUILD FILES <span>{manifest?.file_count??0} ENTRIES</span></div>
      {manifest?manifest.files.map(file=><div className="artifact-file" key={file.path}>
       <span>{file.path}</span><code>{file.sha256.slice(0,16)}…</code><small>{file.bytes.toLocaleString()} bytes</small>
      </div>):<div className="artifact-empty">Waiting for a generated build manifest. No integrity claim is available.</div>}
    </div>
    <div className="artifact-footer">
      <strong>SELF-REPORTED ROOT:</strong> {manifest?.root_sha256??'UNKNOWN'}
      <p>Source commit claim: {manifest?.source.git_commit??'UNKNOWN'} · No private signing keys and no real release gate. Hosted checks do not promote Guardian's deployment attestation above UNKNOWN.</p>
    </div>
   </div>
  </section>
 )
}
