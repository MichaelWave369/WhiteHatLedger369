#!/usr/bin/env node
/**
 * R10 post-deploy reconciliation. Never runs in ordinary PR CI.
 * Fetches this project's PUBLIC GitHub Pages assets only.
 * GitHub CLI validates the hosted manifest against an attestation issued
 * by the exact main Pages workflow for this exact commit.
 */
import {readFile,writeFile,appendFile,mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'
import {
 CUSTODY_SCHEMA,PUBLISHED_BASE,REPOSITORY,SIGNER_WORKFLOW,digestHex,
 inspectServedManifest,compareHostedAssets,custodySummary,
} from './custody-core.mjs'

const MAX_ATTEMPTS=5
const WAIT_MS=12000
const expectedDigest=process.env.EXPECTED_MANIFEST_SHA256
const commit=process.env.GITHUB_SHA
const output='custody-report.json'
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))

async function fetchBounded(url,maximumBytes){
 const target=new URL(url)
 if(target.protocol!=='https:'||target.hostname!=='michaelwave369.github.io'||
    !target.pathname.startsWith('/WhiteHatLedger369/')){
   throw new Error('REMOTE_TARGET_OUT_OF_SCOPE')
 }
 const response=await fetch(target,{redirect:'error',cache:'no-store',
   credentials:'omit',signal:AbortSignal.timeout(25000)})
 if(!response.ok)throw new Error('HTTP_'+response.status)
 const announced=Number(response.headers.get('content-length'))
 if(Number.isFinite(announced)&&announced>maximumBytes)throw new Error('REMOTE_BODY_TOO_LARGE')
 if(!response.body)throw new Error('REMOTE_RESPONSE_EMPTY')
 const chunks=[]
 let count=0
 const reader=response.body.getReader()
 try{
   while(true){
     const {done,value}=await reader.read()
     if(done)break
     count+=value.byteLength
     if(count>maximumBytes)throw new Error('REMOTE_BODY_TOO_LARGE')
     chunks.push(Buffer.from(value))
   }
 }finally{reader.releaseLock()}
 return Buffer.concat(chunks,count)
}
async function attestDownloadedManifest(bytes){
 const dir=await mkdtemp(join(tmpdir(),'whl-r10-'))
 try{
   const path=join(dir,'artifact-manifest.json')
   await writeFile(path,bytes,{mode:0o600})
   const args=['attestation','verify',path,'--repo',REPOSITORY,
     '--signer-workflow',SIGNER_WORKFLOW,'--source-ref','refs/heads/main',
     '--source-digest',commit,'--deny-self-hosted-runners']
   const checked=spawnSync('gh',args,{
     shell:false,encoding:'utf8',timeout:40000,windowsHide:true,
     env:process.env,
   })
   if(checked.error||checked.status!==0)
     throw new Error('GITHUB_SIGSTORE_ATTESTATION_VERIFICATION_FAILED')
 }finally{
   await rm(dir,{recursive:true,force:true})
 }
}
async function reconcileOnce(){
 const manifestBytes=await fetchBounded(PUBLISHED_BASE+'artifact-manifest.json',768*1024)
 const manifest=inspectServedManifest(manifestBytes,expectedDigest,commit)
 await attestDownloadedManifest(manifestBytes)
 const files=await compareHostedAssets(manifest,fetchBounded)
 if(files.status!=='MATCH')throw new Error('HOSTED_ASSETS_DO_NOT_MATCH_ATTESTED_MANIFEST')
 return custodySummary({manifest,manifestSha256:digestHex(manifestBytes),
   files,signatureVerified:true,expectedCommit:commit})
}
async function writeSummary(line){
 if(process.env.GITHUB_STEP_SUMMARY)
  await appendFile(process.env.GITHUB_STEP_SUMMARY,line+'\n')
}
async function main(){
 let lastError='NOT_YET_TESTED'
 for(let attempt=1;attempt<=MAX_ATTEMPTS;attempt++){
   try{
     const verified=await reconcileOnce()
     await writeFile(output,JSON.stringify({...verified,verified_at:new Date().toISOString()},null,2)+'\n')
     console.log(`R10 BYTE_CUSTODY_MATCH: ${verified.hosted_assets.checked} served files match the signed manifest from commit ${commit}.`)
     await writeSummary(`### R10 post-deploy chain of custody: VERIFIED BYTE MATCH\nAttestation signer: \`${SIGNER_WORKFLOW}\` · source: \`${commit}\` · hosted files: ${verified.hosted_assets.checked}/${verified.hosted_assets.total}. **Not a security certification.**`)
     return
   }catch(error){
     lastError=error instanceof Error?error.message:'UNKNOWN_RECONCILIATION_ERROR'
     console.error(`R10 attempt ${attempt}/${MAX_ATTEMPTS}: ${lastError}`)
     if(attempt<MAX_ATTEMPTS)await wait(WAIT_MS)
   }
 }
 const failed={
   schema:CUSTODY_SCHEMA,subject:REPOSITORY,source_commit:commit??null,
   expected_manifest_sha256:expectedDigest??null,conclusion:'UNKNOWN_OR_FAILED',
   attempted_at:new Date().toISOString(),last_error:lastError,
   scope:'Only this GitHub Pages project and its GitHub Actions attestations',
   disclaimer:'Post-deploy check failed or was unavailable; deployed assets already existed. No rollback and no security clearance.',
 }
 await writeFile(output,JSON.stringify(failed,null,2)+'\n')
 await writeSummary(`### R10 post-deploy chain of custody: UNKNOWN / FAILED\n${lastError}. The deployment occurred before this check; **no rollback is implied.**`)
 throw new Error('POST_DEPLOY_CUSTODY_UNVERIFIED: '+lastError)
}
main().catch(error=>{
 console.error(error instanceof Error?error.message:error)
 process.exitCode=1
})
