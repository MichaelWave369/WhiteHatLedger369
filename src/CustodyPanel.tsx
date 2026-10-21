import {useEffect,useState} from 'react'

const RUNS_URL='https://api.github.com/repos/MichaelWave369/WhiteHatLedger369/actions/workflows/pages.yml/runs?branch=main&per_page=5'
type GitHubRun={id:number;status:string;conclusion:string|null;html_url:string;head_sha:string}
type GitHubJob={id:number;name:string;status:string;conclusion:string|null}
type RunStatus={
 run:GitHubRun
 custody:GitHubJob|null
}
function safeGitHubURL(input:string):string|null{
 try{
   const url=new URL(input)
   return url.protocol==='https:'&&url.hostname==='github.com'&&
    url.pathname.startsWith('/MichaelWave369/WhiteHatLedger369/actions/runs/')
    ?url.href:null
 }catch{return null}
}
export default function CustodyPanel(){
 const [latest,setLatest]=useState<RunStatus|null>(null)
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 useEffect(()=>{
   const controller=new AbortController()
   const load=async()=>{
     const runsResponse=await fetch(RUNS_URL,{
       signal:controller.signal,cache:'no-store',headers:{Accept:'application/vnd.github+json'},
     })
     if(!runsResponse.ok)throw new Error('GitHub Actions metadata unavailable')
     const runsData:unknown=await runsResponse.json()
     if(!runsData||typeof runsData!=='object'||!('workflow_runs' in runsData)||
       !Array.isArray(runsData.workflow_runs))throw new Error('Invalid GitHub response')
     const run=runsData.workflow_runs[0] as GitHubRun|undefined
     if(!run||!Number.isSafeInteger(run.id)||run.id<1||
       typeof run.html_url!=='string'||!safeGitHubURL(run.html_url))
       throw new Error('No matching Pages run found')
     const jobsURL='https://api.github.com/repos/MichaelWave369/WhiteHatLedger369/actions/runs/'+run.id+'/jobs?per_page=70'
     const jobsResponse=await fetch(jobsURL,{signal:controller.signal,cache:'no-store',
       headers:{Accept:'application/vnd.github+json'}})
     if(!jobsResponse.ok)throw new Error('GitHub job details unavailable')
     const jobsData:unknown=await jobsResponse.json()
     if(!jobsData||typeof jobsData!=='object'||!('jobs' in jobsData)||
       !Array.isArray(jobsData.jobs))throw new Error('Invalid job list')
     const jobs=jobsData.jobs as GitHubJob[]
     const custody=jobs.find(j=>j.name==='Post-deploy public chain of custody')??null
     if(!controller.signal.aborted)setLatest({run,custody})
   }
   void load().catch((e:unknown)=>{
     if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Cannot load Actions status')
   }).finally(()=>{if(!controller.signal.aborted)setLoading(false)})
   return ()=>controller.abort()
 },[])
 const run=latest?.run
 const custody=latest?.custody
 const succeeded=run?.status==='completed'&&run.conclusion==='success'&&custody?.conclusion==='success'
 const failed=run?.status==='completed'&&(run.conclusion==='failure'||custody?.conclusion==='failure')
 const state=succeeded?'ACTION JOB PASSED':failed?'ACTION JOB FAILED':
   loading?'CHECKING…':custody?.status==='in_progress'?'VERIFYING…':'UNKNOWN'
 const details=succeeded?
   'Public GitHub Actions metadata reports that the post-deploy byte comparison and GitHub CLI attestation checks passed. This browser did not repeat that cryptographic verification.':
   failed?'The latest Pages workflow or custody job failed. See GitHub Actions for the exact reason. Deployment may already have completed.':
   'The latest Pages run has not produced a verified custody result, or GitHub public Actions data is unavailable.'
 const url=run?.html_url?safeGitHubURL(run.html_url):null
 return (
  <section className="custody-section" aria-labelledby="custody-title">
   <div className="panel-heading">
    <div><span className="section-index">12 / CHAIN OF CUSTODY · R10</span><h2 id="custody-title">The delivery witness</h2></div>
    <span className="custody-badge">POST-DEPLOY / PUBLIC READ-ONLY</span>
   </div>
   <div className="custody-shell">
    <div className="custody-hero">
      <div>
       <span className="gauntlet-kicker">SIGNED BUILD → PUBLISHED BYTES → RECONCILIATION</span>
       <h3>Trust the delivery.<br/><span>Check the actual bytes.</span></h3>
       <p>R10 adds a separate GitHub Actions job **after Pages deployment**. It downloads the manifest from the live public site, compares its SHA-256 with the exact build's manifest, verifies the GitHub/Sigstore attestation with the same source commit, then fetches every hosted file and recomputes its hash.</p>
       <p>The runner's public status can be inspected here. To verify cryptographic provenance independently on your own computer, follow R9's GitHub CLI instructions above.</p>
      </div>
      <div className="custody-current">
       <span>GITHUB ACTIONS / POST-DEPLOY JOB</span>
       <strong className={succeeded?'custody-good':failed?'custody-bad':'custody-neutral'}>{state}</strong>
       <p>{details}</p>
       <div><span>LAST MAIN RUN</span><b>{run?.status??'UNKNOWN'}</b></div>
       <div><span>COMMIT</span><b>{run?.head_sha?.slice(0,12)??'UNKNOWN'}</b></div>
       <div><span>JOB RESULT</span><b>{custody?.conclusion??custody?.status??'NOT AVAILABLE'}</b></div>
       {url&&<a href={url} target="_blank" rel="noopener noreferrer">OPEN EVIDENCE ON GITHUB ↗</a>}
      </div>
    </div>
    <div className="custody-stages">
      <div><span>01</span><b>Fingerprint</b><small>R8 hashes complete built files</small></div>
      <div><span>02</span><b>Attest</b><small>R9 signs the build manifest with GitHub identity</small></div>
      <div><span>03</span><b>Publish</b><small>GitHub Pages deploys the site</small></div>
      <div><span>04</span><b>Reconcile</b><small>R10 verifies served manifest and files against signed build</small></div>
    </div>
    {error&&<div className="feedback error" role="alert">{error}. No custody success is inferred.</div>}
    <div className="custody-note">
      <strong>IMPORTANT BOUNDARY:</strong> This panel shows public GitHub Actions job metadata, not browser-side cryptographic proof. The post-deploy check can detect mismatches and fail its job, but the Pages deployment happens **first** and cannot be automatically rolled back by this code. A passing chain of custody does not certify that the application has no vulnerabilities or that an agent is authorized to act.
    </div>
    <div className="custody-footer">
      <strong>REVIEW THE SOURCE AND PUBLIC JOB RECORD</strong>
      <div><a href="https://github.com/MichaelWave369/WhiteHatLedger369/actions/workflows/pages.yml" target="_blank" rel="noopener noreferrer">PAGES WORKFLOW ↗</a><a href="https://github.com/MichaelWave369/WhiteHatLedger369/blob/main/docs/CUSTODY.md" target="_blank" rel="noopener noreferrer">CUSTODY SPEC ↗</a></div>
    </div>
   </div>
  </section>
 )
}
