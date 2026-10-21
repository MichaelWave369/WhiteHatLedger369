/**
 * R8 same-origin website self-consistency checker.
 * Public manifests and assets are controlled by the same host; this is NOT
 * independently trusted deployment attestation.
 */
export const ARTIFACT_SCHEMA='whitehatledger369.artifact-witness.v1'
export const ARTIFACT_DOMAIN='WHL369-R8-BUILD-FILES-V1\n'
const HASH=/^[a-f0-9]{64}$/
const MAX_COUNT=1000
const MAX_BYTES=200*1024*1024
const MAX_FILE=50*1024*1024
export interface WitnessFile {
  path:string
  bytes:number
  sha256:string
}
export interface ArtifactManifest {
  schema:typeof ARTIFACT_SCHEMA
  subject:'MichaelWave369/WhiteHatLedger369'
  generated_at:string
  mode:'SELF_REPORTED_BUILD_DIGESTS'
  source:{
    manifest_sha256:string|null
    lock_sha256:string|null
    git_commit:string|null
    integrity:'UNSIGNED_BUILDER_CLAIM'
  }
  file_count:number
  total_bytes:number
  root_sha256:string
  files:WitnessFile[]
  disclaimer:string
}
export interface HostedCheck {
  status:'MATCH'|'MISMATCH'|'UNAVAILABLE'
  checked:number
  total:number
  reason:string
  mismatched:string[]
}
const isObj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)
export function isSafeWitnessPath(path:unknown):path is string {
 if(typeof path!=='string'||path.length===0||path.length>240||
    !/^[a-zA-Z0-9_@.\/-]+$/.test(path)||path.startsWith('/')||
    path.includes('//')||path==='artifact-manifest.json')return false
 return path.split('/').every(p=>p!==''&&p!=='.'&&p!=='..')
}
async function sha256(data:BufferSource):Promise<string> {
 const digest=await crypto.subtle.digest('SHA-256',data)
 return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')
}
export async function checksumWitnessFiles(files:WitnessFile[]):Promise<string>{
 const message=new TextEncoder().encode(ARTIFACT_DOMAIN+JSON.stringify(files))
 return sha256(message)
}
export function isArtifactManifest(value:unknown):value is ArtifactManifest {
 if(!isObj(value)||value.schema!==ARTIFACT_SCHEMA||
    value.subject!=='MichaelWave369/WhiteHatLedger369'||
    value.mode!=='SELF_REPORTED_BUILD_DIGESTS'||!isObj(value.source)||
    value.source.integrity!=='UNSIGNED_BUILDER_CLAIM'||
    !(value.source.manifest_sha256===null||(typeof value.source.manifest_sha256==='string'&&HASH.test(value.source.manifest_sha256)))||
    !(value.source.lock_sha256===null||(typeof value.source.lock_sha256==='string'&&HASH.test(value.source.lock_sha256)))||
    !(value.source.git_commit===null||(typeof value.source.git_commit==='string'&&/^[a-f0-9]{40}$/.test(value.source.git_commit)))||
    typeof value.generated_at!=='string'||!Number.isFinite(Date.parse(value.generated_at))||
    typeof value.disclaimer!=='string'||typeof value.root_sha256!=='string'||!HASH.test(value.root_sha256)||
    !Number.isSafeInteger(value.file_count)||(value.file_count as number)<1||
    (value.file_count as number)>MAX_COUNT||
    !Number.isSafeInteger(value.total_bytes)||(value.total_bytes as number)<0||
    (value.total_bytes as number)>MAX_BYTES||
    !Array.isArray(value.files)||value.files.length!==value.file_count)return false
 let prior='',total=0
 for(const record of value.files){
   if(!isObj(record)||!isSafeWitnessPath(record.path)||
      typeof record.sha256!=='string'||!HASH.test(record.sha256)||
      !Number.isSafeInteger(record.bytes)||record.bytes<0||record.bytes>MAX_FILE||
      record.path<=prior)return false
   total+=record.bytes
   prior=record.path
 }
 return total===value.total_bytes
}
export async function verifyManifestRoot(manifest:ArtifactManifest):Promise<boolean>{
 if(!isArtifactManifest(manifest)||!crypto?.subtle)return false
 return await checksumWitnessFiles(manifest.files)===manifest.root_sha256
}
export async function fetchArtifactManifest(signal:AbortSignal):Promise<ArtifactManifest> {
 const url=new URL(`${import.meta.env.BASE_URL}artifact-manifest.json`,location.origin)
 const response=await fetch(url,{credentials:'omit',cache:'no-store',redirect:'error',signal})
 if(!response.ok)throw new Error('Published R8 artifact manifest unavailable')
 const body=await response.text()
 if(body.length>768*1024)throw new Error('Published manifest exceeds size limit')
 const parsed:unknown=JSON.parse(body)
 if(!isArtifactManifest(parsed)||!(await verifyManifestRoot(parsed)))
   throw new Error('Published artifact manifest inconsistent or malformed')
 return parsed
}
export async function verifyHostedFiles(
 manifest:ArtifactManifest,
 signal:AbortSignal,
 onProgress?:(count:number)=>void,
):Promise<HostedCheck>{
 if(!isArtifactManifest(manifest)||!(await verifyManifestRoot(manifest)))
  return {status:'MISMATCH',checked:0,total:0,reason:'Invalid or altered manifest root',mismatched:[]}
 if(!crypto?.subtle)
  return {status:'UNAVAILABLE',checked:0,total:manifest.files.length,reason:'Browser Web Crypto unavailable',mismatched:[]}
 const base=new URL(import.meta.env.BASE_URL,location.origin)
 const problems:string[]=[]
 let checked=0
 for(const item of manifest.files){
   if(signal.aborted)return {status:'UNAVAILABLE',checked,total:manifest.files.length,reason:'Check canceled',mismatched:problems}
   try{
     const url=new URL(item.path,base)
     if(url.origin!==location.origin||!url.pathname.startsWith(base.pathname))
       throw new Error('Out-of-scope artifact path')
     const response=await fetch(url,{credentials:'omit',cache:'no-store',redirect:'error',signal})
     if(!response.ok)throw new Error('Missing asset')
     const bytes=await response.arrayBuffer()
     const actual=await sha256(bytes)
     if(bytes.byteLength!==item.bytes||actual!==item.sha256)problems.push(item.path)
   }catch{
     if(signal.aborted)return {status:'UNAVAILABLE',checked,total:manifest.files.length,reason:'Check canceled',mismatched:problems}
     problems.push(item.path)
   }
   checked++
   onProgress?.(checked)
 }
 return {
   status:problems.length?'MISMATCH':'MATCH',
   checked,
   total:manifest.files.length,
   reason:problems.length?'One or more hosted asset bytes differ from the same-host manifest':
     'All hosted bytes match the self-published manifest (not independent provenance)',
   mismatched:problems,
 }
}
