/**
 * R10 off-host custody verification of a single first-party GitHub Pages site.
 * This is an actual byte comparison against the attested R8 manifest; it is
 * not a malware scan, a penetration test, or a security certification.
 */
import {createHash} from 'node:crypto'
import {validateArtifactManifest,hashBytes} from './artifact-core.mjs'

export const CUSTODY_SCHEMA='whitehatledger369.postdeploy-custody.v1'
export const PUBLISHED_BASE='https://michaelwave369.github.io/WhiteHatLedger369/'
export const REPOSITORY='MichaelWave369/WhiteHatLedger369'
export const SIGNER_WORKFLOW=REPOSITORY+'/.github/workflows/pages.yml'
const SHA256=/^[a-f0-9]{64}$/
const GIT_SHA=/^[a-f0-9]{40}$/
const MAX_MANIFEST=768*1024
const MAX_FILE=50*1024*1024
const MAX_TOTAL=200*1024*1024

export const digestHex=data=>createHash('sha256').update(data).digest('hex')

export function inspectServedManifest(manifestBytes,expectedDigest,expectedCommit){
 if(!SHA256.test(expectedDigest||''))throw new Error('EXPECTED_DIGEST_NOT_PINNED')
 if(!GIT_SHA.test(expectedCommit||''))throw new Error('EXPECTED_SOURCE_COMMIT_NOT_PINNED')
 if(!Buffer.isBuffer(manifestBytes)||manifestBytes.length===0||
    manifestBytes.length>MAX_MANIFEST)throw new Error('MANIFEST_MISSING_OR_TOO_LARGE')
 const actual=digestHex(manifestBytes)
 if(actual!==expectedDigest)throw new Error('PUBLISHED_MANIFEST_DIFFERS_FROM_ATTESTED_BUILD')
 let manifest
 try{manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(manifestBytes))}
 catch{throw new Error('INVALID_PUBLISHED_MANIFEST_JSON')}
 if(!validateArtifactManifest(manifest))throw new Error('INVALID_PUBLISHED_MANIFEST_SCHEMA')
 if(manifest.source.git_commit!==expectedCommit)throw new Error('PUBLISHED_SOURCE_COMMIT_MISMATCH')
 return manifest
}

export async function compareHostedAssets(manifest,fetchFile){
 if(!validateArtifactManifest(manifest))throw new Error('INVALID_MANIFEST_BEFORE_ASSET_CHECK')
 if(typeof fetchFile!=='function')throw new Error('ASSET_FETCHER_MISSING')
 let total=0
 const errors=[]
 for(const entry of manifest.files){
   const url=new URL(entry.path,PUBLISHED_BASE)
   if(url.origin!=='https://michaelwave369.github.io'||
      !url.pathname.startsWith('/WhiteHatLedger369/'))throw new Error('OUT_OF_SCOPE_FILE_PATH')
   let body
   try{
     body=await fetchFile(url.href,Math.min(MAX_FILE,entry.bytes+1))
     if(!Buffer.isBuffer(body))throw new Error('Not byte data')
   }catch(e){
     errors.push({path:entry.path,reason:'FILE_UNAVAILABLE',note:e instanceof Error?e.message:'unknown'})
     continue
   }
   total+=body.length
   if(total>MAX_TOTAL)throw new Error('REMOTE_BYTE_BUDGET_EXCEEDED')
   if(body.length!==entry.bytes || hashBytes(body)!==entry.sha256)
     errors.push({path:entry.path,reason:'FILE_CONTENT_OR_LENGTH_MISMATCH'})
 }
 return {
   status:errors.length?'FAIL':'MATCH',
   checked:manifest.files.length-errors.filter(x=>x.reason==='FILE_UNAVAILABLE').length,
   total:manifest.files.length,
   mismatches:errors,
   totalFetchedBytes:total,
 }
}

export function custodySummary({manifest,manifestSha256,files,signatureVerified,expectedCommit}){
 if(!manifest||!SHA256.test(manifestSha256||'')||!GIT_SHA.test(expectedCommit||'')||
    !files||typeof files!=='object')throw new Error('INCOMPLETE_CUSTODY_INPUTS')
 return {
  schema:CUSTODY_SCHEMA,
  subject:REPOSITORY,
  source_commit:expectedCommit,
  expected_manifest_sha256:manifestSha256,
  attestation:{
    status:signatureVerified===true?'VERIFIED_IN_GITHUB_CLI':'UNKNOWN',
    issuer:'GitHub Actions / Sigstore',
    signer_workflow:SIGNER_WORKFLOW,
    source_ref:'refs/heads/main',
    source_digest:expectedCommit,
  },
  served_manifest:{status:'MATCH',file_count:manifest.file_count,root_sha256:manifest.root_sha256},
  hosted_assets:{status:files.status,checked:files.checked,total:files.total,
    mismatches:files.mismatches,total_fetched_bytes:files.totalFetchedBytes},
  conclusion:signatureVerified===true&&files.status==='MATCH'&&files.checked===files.total?'BYTE_CUSTODY_MATCH':'NOT_VERIFIED',
  scope:'Public GitHub Pages site and GitHub Actions attested build manifest only',
  claims_not_established:['Vulnerability absence','Authorized third-party testing','Uncompromised build runner','Independent production security certification'],
  disclaimer:'Public post-deployment byte reconciliation. An attested build can still contain vulnerabilities. Not an all-requirements release approval.',
 }
}
