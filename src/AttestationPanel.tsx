import {useEffect,useState} from 'react'

const REPOSITORY='MichaelWave369/WhiteHatLedger369'
const SIGNER=REPOSITORY+'/.github/workflows/pages.yml'
const VERIFY_COMMAND='gh attestation verify artifact-manifest.json -R '+REPOSITORY+' --signer-workflow '+SIGNER+' --source-ref refs/heads/main'
const MANIFEST_URL=import.meta.env.BASE_URL+'artifact-manifest.json'

function digestHex(bytes:ArrayBuffer):Promise<string>{
  return crypto.subtle.digest('SHA-256',bytes).then(result=>
    Array.from(new Uint8Array(result),b=>b.toString(16).padStart(2,'0')).join(''))
}

export default function AttestationPanel(){
 const [digest,setDigest]=useState('')
 const [error,setError]=useState('')
 const [copyNote,setCopyNote]=useState('')
 useEffect(()=>{
   const controller=new AbortController()
   const load=async()=>{
     const response=await fetch(MANIFEST_URL,{credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal})
     if(!response.ok)throw new Error('No published build manifest received')
     const body=await response.arrayBuffer()
     if(body.byteLength<1||body.byteLength>768*1024)throw new Error('Manifest size invalid')
     const parsed:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(body))
     if(!parsed||typeof parsed!=='object')throw new Error('Manifest JSON invalid')
     if(!controller.signal.aborted)setDigest(await digestHex(body))
   }
   void load().catch((e:unknown)=>{
     if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Unable to read manifest')
   })
   return ()=>controller.abort()
 },[])
 async function copyCommand(){
   try{
     await navigator.clipboard.writeText(VERIFY_COMMAND)
     setCopyNote('Verification command copied')
   }catch{
     setCopyNote('Copy unavailable; select the command text below')
   }
 }
 return (
  <section className="attestation-section" aria-labelledby="attestation-title">
    <div className="panel-heading">
      <div><span className="section-index">11 / ATTESTED BUILD · R9</span><h2 id="attestation-title">The independent witness</h2></div>
      <span className="attestation-badge">GITHUB SIGSTORE / MANIFEST</span>
    </div>
    <div className="attestation-shell">
      <div className="attestation-hero">
        <div>
          <span className="gauntlet-kicker">BUILD IDENTITY · SHORT-LIVED SIGNING · VERIFIED SUBJECT</span>
          <h3>A real signer.<br/><span>An external verifier.</span></h3>
          <p>R9 configures the GitHub Pages build to request a GitHub OIDC identity and use <code>actions/attest@v4</code> to attest R8's <code>artifact-manifest.json</code>. A separate GitHub CLI verification step must succeed before the Pages artifact can be uploaded.</p>
          <p className="attestation-limit">This page cannot validate a Sigstore certificate chain itself. Download the manifest and verify it against GitHub's attestation service and the exact Pages workflow identity, independently of this website.</p>
        </div>
        <div className="attestation-status">
          <span>EXTERNAL CRYPTOGRAPHIC VERIFICATION</span>
          <strong>NOT VERIFIED HERE</strong>
          <small>Never interpret a configured signing workflow as an issued or verified attestation. GitHub Actions must run after merge; a separate trusted CLI must check the downloaded file.</small>
          <div><span>EXPECTED ISSUER</span><b>GitHub Actions / OIDC</b></div>
          <div><span>SIGNED SUBJECT</span><b>R8 manifest bytes</b></div>
          <div><span>WORKFLOW</span><b>pages.yml · main</b></div>
        </div>
      </div>
      <div className="attestation-digest">
        <span>SHA-256 OF MANIFEST RETURNED BY THIS SITE</span>
        <code>{digest||'UNAVAILABLE · NOT VERIFIED'}</code>
        {error&&<p role="alert">{error}. No cryptographic attestation is claimed.</p>}
        <small>This is only a local hash of delivered bytes. The independent CLI must verify an attestation for this same file.</small>
      </div>
      <div className="attestation-verify">
        <div>
          <span className="minotaur-section-label">INDEPENDENT VERIFICATION PROCEDURE</span>
          <h4>Verify the signer, not just the checksum.</h4>
          <p>Download the current manifest and use GitHub CLI, authenticated if requested. The verification requires the exact repository, <code>pages.yml</code> signer, and <code>main</code> source ref.</p>
        </div>
        <div className="attestation-commands">
          <p><strong>1.</strong> Download the manifest served on GitHub Pages.</p>
          <a href={MANIFEST_URL} download="artifact-manifest.json">DOWNLOAD MANIFEST ↓</a>
          <p><strong>2.</strong> In a terminal with the <code>gh</code> CLI installed, run:</p>
          <pre><code>{VERIFY_COMMAND}</code></pre>
          <button type="button" onClick={()=>void copyCommand()}>COPY VERIFY COMMAND</button>
          <span aria-live="polite">{copyNote}</span>
          <p><strong>3.</strong> Treat a nonzero exit, mismatched identity, or missing attestation as <b>UNKNOWN / NOT VERIFIED</b>. Check the signer and source identity in the CLI output.</p>
        </div>
      </div>
      <div className="attestation-footer">
        <strong>BOUNDARY:</strong> The GitHub-generated provenance identifies the workflow and signed subject bytes when independently verified. It is not evidence that application code is vulnerability-free, that a deployed site serves the same bytes, or that GitHub's own runner was uncompromised. R6 Release Guardian remains advisory with real-world security and deployment claims UNKNOWN.
        <p><a href="https://github.com/MichaelWave369/WhiteHatLedger369/blob/main/docs/ATTESTATION.md" target="_blank" rel="noopener noreferrer">READ VERIFICATION POLICY ↗</a></p>
      </div>
    </div>
  </section>
 )
}
