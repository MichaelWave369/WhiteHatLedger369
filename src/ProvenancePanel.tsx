import {useEffect,useMemo,useState} from 'react'
import {fetchProvenance,provenanceIsStale,type ProvenanceReport} from './lib/provenance'

export default function ProvenancePanel(){
 const [report,setReport]=useState<ProvenanceReport|null>(null)
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 const [query,setQuery]=useState('')
 const [showAll,setShowAll]=useState(false)
 useEffect(()=>{
   const ctrl=new AbortController()
   void fetchProvenance(ctrl.signal).then(data=>{
     if(!ctrl.signal.aborted)setReport(data)
   }).catch((cause:unknown)=>{
     if(!ctrl.signal.aborted)setError(cause instanceof Error?cause.message:'Could not read inventory')
   }).finally(()=>{if(!ctrl.signal.aborted)setLoading(false)})
   return ()=>ctrl.abort()
 },[])
 const stale=report?provenanceIsStale(report):true
 const entries=useMemo(()=>{
   const q=query.trim().toLowerCase()
   return (report?.entries??[]).filter(x=>!q||x.name.toLowerCase().includes(q)||x.version.includes(q)||x.path.toLowerCase().includes(q))
 },[report,query])
 const visible=showAll?entries:entries.slice(0,24)
 const current=report&&!stale&&report.checks.manifest_lock_consistency==='PASS'
 return <section className="provenance-section" aria-labelledby="provenance-title">
   <div className="panel-heading">
     <div><span className="section-index">09 / SUPPLY CHAIN · R7</span><h2 id="provenance-title">The Dependency Vault</h2></div>
     <span className="provenance-badge">NPM LOCKFILE / READ ONLY</span>
   </div>
   <div className="provenance-shell">
     <div className="provenance-lead">
       <div>
         <span className="gauntlet-kicker">EXACT RESOLUTION · CHECKED IN SOURCE</span>
         <h3>Know what's locked.<br/><span>Know what isn't proven.</span></h3>
         <p>R7 commits a real npm v3 lockfile and verifies its declared dependency graph and registry integrity metadata. GitHub Actions installs with <code>npm ci</code>, which respects the committed lock instead of silently resolving new versions.</p>
         <p>It is a lockfile declaration, not an independently attested inventory of a deployed server or a guarantee that packages are safe.</p>
       </div>
       <div className="provenance-status-card">
         <span>LOCKFILE REPORT</span>
         <strong className={current?'provenance-ok':'provenance-unknown'}>{loading?'LOADING':current?'SOURCE MATCH':'UNKNOWN / STALE'}</strong>
         <small>{report?.generated_at?new Date(report.generated_at).toLocaleString():'No generated report yet'}</small>
         <div><span>REGISTRY INTEGRITY</span><b>{current?report?.checks.entries_registry_sha512:'UNKNOWN'}</b></div>
         <div><span>INSTALLED TREE PROOF</span><b>UNKNOWN</b></div>
         <div><span>DEPLOY ATTESTATION</span><b>UNKNOWN</b></div>
       </div>
     </div>
     <div className="provenance-metrics">
       <div><span>LOCKED ENTRIES</span><strong>{current?report?.summary.locked_entries:'—'}</strong></div>
       <div><span>SHA-512 METADATA</span><strong>{current?report?.summary.sha512_integrity:'—'}</strong></div>
       <div><span>OPTIONAL PACKAGES</span><strong>{current?report?.summary.optional_entries:'—'}</strong></div>
       <div><span>UNVERIFIED SOURCES</span><strong>{current?report?.summary.incomplete:'—'}</strong></div>
     </div>
     {error&&<div className="feedback error" role="alert">{error}. Provenance remains UNKNOWN.</div>}
     <div className="provenance-warning">
       <strong>NO SECURE-RELEASE CLAIM.</strong> The inventory is generated in CI from a committed lockfile, and its report is unsigned. Integrity metadata helps npm verify downloaded package tarballs, but it does not establish maintainer trust, supply-chain safety, real installation state, or independent build provenance. Guardian's missing production attestations remain UNKNOWN.
     </div>
     <div className="provenance-catalog">
       <div className="provenance-catalog-head">
         <div><span className="minotaur-section-label">FROZEN DEPENDENCY GRAPH / REGISTRY RECORDS</span><p>{entries.length} matching entries · source package-lock.json</p></div>
         <input type="search" placeholder="Filter package or version…" aria-label="Filter dependency inventory"
           value={query} onChange={event=>{setQuery(event.target.value);setShowAll(false)}} disabled={!current}/>
       </div>
       <div className="provenance-table-wrap">
         <table className="provenance-table">
           <thead><tr><th>PACKAGE</th><th>LOCKED VERSION</th><th>INTEGRITY</th><th>TYPE</th></tr></thead>
           <tbody>
             {current?visible.map(x=><tr key={x.path}>
               <td><strong>{x.name}</strong><small>{x.path}</small></td>
               <td><code>{x.version}</code></td>
               <td><span className={x.integrity==='sha512'&&x.source==='npm-registry'?'provenance-hash-good':'provenance-hash-unknown'}>{x.integrity==='sha512'&&x.source==='npm-registry'?'SHA-512 LOCK':'UNVERIFIED'}</span></td>
               <td><span>{x.optional?'optional':x.development?'development':'runtime'}</span></td>
             </tr>):<tr><td colSpan={4} className="provenance-no-data">A fresh validated lockfile inventory has not been published.</td></tr>}
           </tbody>
         </table>
       </div>
       {current&&entries.length>24&&<div className="provenance-pagination">
         <span>Showing {visible.length} of {entries.length} matching lock entries</span>
         <button type="button" onClick={()=>setShowAll(v=>!v)}>{showAll?'SHOW FIRST 24':'SHOW ALL MATCHES'}</button>
       </div>}
     </div>
     <div className="provenance-footer">
       <strong>SOURCE BINDING:</strong> Lock SHA-256: {current?report?.source.lock_sha256:'UNKNOWN'}.
       <p>Digest metadata is a claim by the current website's CI environment, not a signed third-party attestation. This does not yet satisfy Guardian's independently verifiable production SBOM or deployment evidence requirements.</p>
     </div>
   </div>
 </section>
}
