/**
 * R8 Artifact Witness - deterministic, unsigned static-build fingerprint format.
 * Hashes a concrete local dist/ directory, not remote/unknown infrastructure.
 * This is SELF-REPORTED data; a compromised builder can forge it.
 */
import { readdir, lstat, readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, posix, resolve, dirname } from 'node:path'

export const ARTIFACT_SCHEMA='whitehatledger369.artifact-witness.v1'
export const ARTIFACT_SUBJECT='MichaelWave369/WhiteHatLedger369'
export const ARTIFACT_FILE='artifact-manifest.json'
export const ARTIFACT_DOMAIN='WHL369-R8-BUILD-FILES-V1\n'
const DIGEST=/^[a-f0-9]{64}$/
const MAX_ENTRIES=1000
const MAX_FILE=50*1024*1024
const MAX_TOTAL=200*1024*1024
const MAX_MANIFEST=768*1024
const allowed=/^[a-zA-Z0-9_@.\/-]+$/
export const hashBytes=data=>createHash('sha256').update(data).digest('hex')
export const hashText=text=>hashBytes(Buffer.from(text,'utf8'))
export function isSafeArtifactPath(name){
  if(typeof name!=='string'||name.length<1||name.length>240||!allowed.test(name)||
     name.startsWith('/')||name.includes('\\')||name.includes('//')||name===ARTIFACT_FILE)return false
  const segments=name.split('/')
  return !segments.some(part=>part==='.'||part==='..'||part==='')
}
function validHash(source){
  return source===null||(typeof source==='string'&&DIGEST.test(source))
}
function validSource(source){
 return source&&typeof source==='object'&&
  validHash(source.manifest_sha256)&&validHash(source.lock_sha256)&&
  (source.git_commit===null||(typeof source.git_commit==='string'&&/^[a-f0-9]{40}$/.test(source.git_commit)))&&
  source.integrity==='UNSIGNED_BUILDER_CLAIM'
}
export function fingerprint(entries){
  return hashText(ARTIFACT_DOMAIN+JSON.stringify(entries))
}
export function validateArtifactManifest(payload){
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||
     payload.schema!==ARTIFACT_SCHEMA||payload.subject!==ARTIFACT_SUBJECT||
     payload.mode!=='SELF_REPORTED_BUILD_DIGESTS'||!validSource(payload.source)||
     typeof payload.generated_at!=='string'||!Number.isFinite(Date.parse(payload.generated_at))||
     !Number.isSafeInteger(payload.file_count)||!Number.isSafeInteger(payload.total_bytes)||
     !Array.isArray(payload.files)||payload.files.length!==payload.file_count||
     payload.file_count<1||payload.file_count>MAX_ENTRIES||payload.total_bytes<0||
     payload.total_bytes>MAX_TOTAL||typeof payload.root_sha256!=='string'||
     !DIGEST.test(payload.root_sha256))return false
  let last='',bytes=0
  for(const file of payload.files){
    if(!file||typeof file!=='object'||Array.isArray(file)||
       Object.keys(file).sort().join(',')!=='bytes,path,sha256'||
       !isSafeArtifactPath(file.path)||file.path<=last||
       !Number.isSafeInteger(file.bytes)||file.bytes<0||file.bytes>MAX_FILE||
       typeof file.sha256!=='string'||!DIGEST.test(file.sha256))return false
    bytes+=file.bytes
    last=file.path
  }
  return bytes===payload.total_bytes&&fingerprint(payload.files)===payload.root_sha256
}
async function scanDirectory(directory){
  const dir=resolve(directory)
  const list=[]
  let total=0
  async function walk(relative){
    const here=relative?join(dir,...relative.split('/')):dir
    for(const child of await readdir(here,{withFileTypes:true})){
      const current=relative?relative+'/'+child.name:child.name
      if(!isSafeArtifactPath(current) && current!==ARTIFACT_FILE)
        throw new Error('UNSAFE_ARTIFACT_PATH: '+current)
      if(current===ARTIFACT_FILE)continue
      const full=join(here,child.name)
      const stat=await lstat(full)
      if(stat.isSymbolicLink()||(!stat.isFile()&&!stat.isDirectory()))
        throw new Error('UNSAFE_ARTIFACT_TYPE: '+current)
      if(stat.isDirectory()){await walk(current);continue}
      if(stat.size>MAX_FILE)throw new Error('ARTIFACT_TOO_LARGE: '+current)
      const contents=await readFile(full)
      if(contents.byteLength!==stat.size)throw new Error('ARTIFACT_CHANGED_WHILE_READING')
      list.push({path:current,bytes:contents.length,sha256:hashBytes(contents)})
      total+=contents.length
      if(list.length>MAX_ENTRIES||total>MAX_TOTAL)throw new Error('ARTIFACT_BUDGET_EXCEEDED')
    }
  }
  const root=await lstat(dir)
  if(!root.isDirectory()||root.isSymbolicLink())throw new Error('NOT_A_SAFE_DIST_DIRECTORY')
  await walk('')
  list.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0)
  if(list.length===0)throw new Error('EMPTY_BUILD')
  return {files:list,total_bytes:total}
}

export async function stampArtifactDirectory(directory,{
  manifestSha256=null,lockSha256=null,commit=null,now=()=>new Date(),
}={}){
  const observed=await scanDirectory(directory)
  const date=now()
  if(!(date instanceof Date)||!Number.isFinite(date.getTime()))throw new Error('BAD_TIMESTAMP')
  const result={
    schema:ARTIFACT_SCHEMA,
    subject:ARTIFACT_SUBJECT,
    generated_at:date.toISOString(),
    mode:'SELF_REPORTED_BUILD_DIGESTS',
    source:{
      manifest_sha256:manifestSha256,
      lock_sha256:lockSha256,
      git_commit:typeof commit==='string'&&/^[a-f0-9]{40}$/.test(commit)?commit:null,
      integrity:'UNSIGNED_BUILDER_CLAIM',
    },
    file_count:observed.files.length,
    total_bytes:observed.total_bytes,
    root_sha256:fingerprint(observed.files),
    files:observed.files,
    disclaimer:'Unsigned checksums collected by the build environment. Detects drift relative to the same published manifest, not malicious builder/host changes or a secure deployment.',
  }
  if(!validateArtifactManifest(result))throw new Error('INVALID_GENERATED_MANIFEST')
  const serialized=JSON.stringify(result,null,2)+'\n'
  if(Buffer.byteLength(serialized)>MAX_MANIFEST)throw new Error('MANIFEST_BUDGET_EXCEEDED')
  await mkdir(directory,{recursive:true})
  await writeFile(join(resolve(directory),ARTIFACT_FILE),serialized,{flag:'w',mode:0o644})
  return result
}

export async function verifyArtifactDirectory(directory,{
 manifestSha256=null,lockSha256=null,
}={}){
  let report
  try{
    const file=await readFile(join(resolve(directory),ARTIFACT_FILE))
    if(file.byteLength>MAX_MANIFEST)return {status:'FAIL',reason:'MANIFEST_TOO_LARGE'}
    report=JSON.parse(file.toString('utf8'))
  }catch{return {status:'UNKNOWN',reason:'MANIFEST_MISSING_OR_INVALID'}}
  if(!validateArtifactManifest(report))return {status:'FAIL',reason:'MANIFEST_INVALID_OR_UNTRUSTED'}
  if(manifestSha256!==null&&report.source.manifest_sha256!==manifestSha256)
    return {status:'FAIL',reason:'SOURCE_MANIFEST_HASH_MISMATCH'}
  if(lockSha256!==null&&report.source.lock_sha256!==lockSha256)
    return {status:'FAIL',reason:'SOURCE_LOCK_HASH_MISMATCH'}
  let observed
  try{observed=await scanDirectory(directory)}
  catch(e){return {status:'FAIL',reason:e instanceof Error?e.message:'SCAN_FAILED'}}
  if(fingerprint(observed.files)!==report.root_sha256)
    return {status:'FAIL',reason:'BUILD_FILE_SET_OR_CONTENT_MISMATCH',
      observedFileCount:observed.files.length,expectedFileCount:report.file_count}
  return {status:'PASS',reason:'LOCAL_BYTES_MATCH_SELF_REPORTED_MANIFEST',
    observedFileCount:observed.files.length,expectedFileCount:report.file_count,
    root_sha256:report.root_sha256,
    disclaimer:'Integrity relative to an unsigned manifest; no independent build identity or deployment attestation.'}
}
