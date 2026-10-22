import {useEffect,useState} from 'react'

type Status='PASS'|'REVIEW'|'BLOCK'|'UNKNOWN'
type Finding={path:string,line:number,rule_id:string,severity:string}
type PlurReport={
 schema:string;status:Status;policy_version?:string;scanned_files?:number;note?:string;
 findings?:Finding[];problems?:{path:string;reason:string}[];
 receipt_sha256?:string;source_commit_claim?:string|null;signed?:boolean;certified_secure?:boolean
}
const modes=[
 {label:'Harmless change',status:'PASS' as Status,reason:'The bundled test source has no matching heuristic. This is not proof of harmless intent.'},
 {label:'Permission concern',status:'REVIEW' as Status,reason:'A possible secret-to-network flow requires a human to examine context.'},
 {label:'Obfuscated execution',status:'BLOCK' as Status,reason:'A deterministic decoded-eval pattern is disallowed by this narrow policy.'},
 {label:'Missing policy',status:'UNKNOWN' as Status,reason:'Without policy integrity or complete coverage, the scanner refuses to claim a pass.'}
]
function isReport(x:unknown):x is PlurReport {
 if (!x || typeof x!=='object')return false
 const r=x as Record<string,unknown>
 return r.schema==='WHL369-PLUR-REPORT-V1' && ['PASS','REVIEW','BLOCK','UNKNOWN'].includes(String(r.status))
  && r.signed===false && r.certified_secure===false
}
export default function PlurPanel(){
 const [report,setReport]=useState<PlurReport|null>(null)
 const [error,setError]=useState('')
 const [choice,setChoice]=useState(0)
 useEffect(()=>{
  const controller=new AbortController()
  void fetch(import.meta.env.BASE_URL+'plur-report.json',{signal:controller.signal,cache:'no-store'})
   .then(async response=>{if(!response.ok)throw new Error('Report unavailable');return response.json() as Promise<unknown>})
   .then(data=>{if(!isReport(data))throw new Error('Report schema invalid');setReport(data)})
   .catch((err:unknown)=>{if(!controller.signal.aborted)setError(err instanceof Error?err.message:'Unable to read PLUR observation')})
  return ()=>controller.abort()
 },[])
 const live=report?.note==='NOT_RUN'?null:report
 const status=live?.status??'UNKNOWN'
 const demo=modes[choice]
 return <section className="plur-section" aria-labelledby="plur-title">
  <div className="panel-heading">
   <div><span className="section-index">15 / SUPERWHITEHAT · R13</span><h2 id="plur-title">PLUR Division</h2></div>
   <span className="plur-label">STATIC POLICY OBSERVATION</span>
  </div>
  <div className="plur-shell">
   <div className="plur-overview">
    <div>
     <span className="gauntlet-kicker">PEACE · LOVE · UNITY · RESPECT</span>
     <h3>Trust is earned.<br/><span>Never presumed.</span></h3>
     <p>R13 evaluates the checked-out source against explicit, narrow static rules. It records exact file hashes and evidence limitations. A PASS only means these checks did not report a problem. It does not certify software safety or govern independent forks.</p>
    </div>
    <div className="plur-meter" aria-live="polite">
     <span>LAST PUBLISHED SOURCE OBSERVATION</span>
     <strong className={'plur-result '+status.toLowerCase()}>{status}</strong>
     <small>{live?'Unsigned local-CLI observation from the publication build':'No completed published observation available'}</small>
     <div><span>POLICY</span><b>{live?.policy_version??'NOT VERIFIED'}</b></div>
     <div><span>FILES INSPECTED</span><b>{live?.scanned_files??'—'}</b></div>
     <div><span>OFFICIAL CERTIFICATION</span><b>NOT ISSUED</b></div>
     <div><span>INDEPENDENT FORKS</span><b>NOT CONTROLLED</b></div>
    </div>
   </div>
   {error&&<p className="feedback error" role="alert">{error}. Result remains UNKNOWN.</p>}
   <p className="plur-notice"><strong>POLICY IS NOT A MAGIC OVERRIDE.</strong> Anyone with a fork can change or remove these checks. Only a separately controlled required-check/release-signing system can enforce our official publication rules. R13 does not create a signer or an independently authenticated badge.</p>
   <div className="plur-principles">
    {['Peace / Harmful execution patterns','Love / Potential secret exposure','Unity / Policy-bypass indicators','Respect / Permissions and consent cues'].map(item=><div key={item}>{item}</div>)}
   </div>
   <div className="plur-findings">
    <h4>Published findings and coverage gaps</h4>
    <p>{live?.findings?.length??0} rule matches · {live?.problems?.length??0} coverage problems. This count covers the listed code types, not a complete malware analysis.</p>
    {(live?.findings??[]).slice(0,8).map((item,index)=><div className="plur-observation" key={item.path+item.line+item.rule_id+index}>
      <strong>{item.severity}: {item.rule_id}</strong><span>{item.path}:{item.line}</span>
    </div>)}
    {(live?.problems??[]).slice(0,8).map((item,index)=><div className="plur-observation" key={item.path+item.reason+index}>
      <strong>UNKNOWN: {item.reason}</strong><span>{item.path}</span>
    </div>)}
    {!live&&<p>Awaiting a Pages build-generated report. The checked-in placeholder is not scan evidence.</p>}
    {live?.receipt_sha256&&<p className="plur-digest">Unsigned receipt hash: <code>{live.receipt_sha256}</code></p>}
   </div>
   <div className="plur-training">
    <span className="minotaur-section-label">LOCAL EXAMPLES ONLY · NEVER RUN UNTRUSTED CODE</span>
    <h4>Exercise the decision vocabulary</h4>
    <div className="plur-options">{modes.map((item,index)=><button key={item.label} type="button" className={index===choice?'selected':''} aria-pressed={index===choice} onClick={()=>setChoice(index)}>{item.label}</button>)}</div>
    <div className="plur-demo" aria-live="polite"><strong className={'plur-result '+demo.status.toLowerCase()}>{demo.status} · SYNTHETIC</strong><p>{demo.reason}</p></div>
    <p>The buttons switch fixed explanations; they never run source code, alter the published report, or approve a deployment.</p>
   </div>
   <div className="plur-bottom"><strong>WHAT WE CAN PROVE:</strong> deterministic scanner results against the files it read. <strong>WHAT WE CANNOT:</strong> benign intent, full coverage, real-world safety, or compliance by third-party forks. <a href="https://github.com/MichaelWave369/WhiteHatLedger369/blob/main/docs/PLUR.md" target="_blank" rel="noopener noreferrer">READ R13 THREAT MODEL ↗</a></div>
  </div>
 </section>
}
