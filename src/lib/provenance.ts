export interface LockedPackage {
  path:string
  name:string
  version:string
  license:string|null
  source:'npm-registry'|'other-or-unverified'
  integrity:'sha512'|'missing-or-other'
  integrityValue:string|null
  development:boolean
  optional:boolean
}
export interface ProvenanceReport {
  schema:'whitehatledger369.lock-inventory.v1'
  subject:'MichaelWave369/WhiteHatLedger369'
  generated_at:string|null
  source:{
    manifest_sha256:string|null
    lock_sha256:string|null
    git_commit:string|null
    environment_node:string|null
    integrity:'UNSIGNED_CI_SOURCE_CLAIM'
  }
  scope:string
  summary:{
    locked_entries:number
    sha512_integrity:number
    registry_resolved:number
    development_entries:number
    optional_entries:number
    incomplete:number
  }
  entries:LockedPackage[]
  checks:{
    manifest_lock_consistency:'PASS'|'UNKNOWN'
    entries_registry_sha512:'PASS'|'UNKNOWN'
    installed_tree_attestation:'UNKNOWN'
    deployed_artifact_provenance:'UNKNOWN'
  }
  disclaimer:string
}
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x)
const hex=/^[a-f0-9]{64}$/
function validEntry(x:unknown):x is LockedPackage {
  return object(x)&&typeof x.path==='string'&&x.path.startsWith('node_modules/')&&
    typeof x.name==='string'&&typeof x.version==='string'&&
    (x.license===null||typeof x.license==='string')&&
    (x.source==='npm-registry'||x.source==='other-or-unverified')&&
    (x.integrity==='sha512'||x.integrity==='missing-or-other')&&
    (x.integrityValue===null||typeof x.integrityValue==='string')&&
    typeof x.development==='boolean'&&typeof x.optional==='boolean'
}
export function isProvenanceReport(x:unknown): x is ProvenanceReport {
  if(!object(x)||x.schema!=='whitehatledger369.lock-inventory.v1'||
     x.subject!=='MichaelWave369/WhiteHatLedger369'||!object(x.source)||
     !object(x.checks)||!object(x.summary)||!Array.isArray(x.entries)||
     typeof x.scope!=='string'||typeof x.disclaimer!=='string'||x.source.integrity!=='UNSIGNED_CI_SOURCE_CLAIM')return false
  const {source,summary,entries,checks}=x
  for(const k of ['locked_entries','sha512_integrity','registry_resolved','development_entries','optional_entries','incomplete'])
    if(typeof summary[k]!=='number'||!Number.isSafeInteger(summary[k])||(summary[k] as number)<0)return false
  if(entries.length!==summary.locked_entries||entries.length>20000||!entries.every(validEntry))return false
  if(checks.deployed_artifact_provenance!=='UNKNOWN'||checks.installed_tree_attestation!=='UNKNOWN')return false
  if(x.generated_at===null){
    return entries.length===0&&checks.manifest_lock_consistency==='UNKNOWN'&&checks.entries_registry_sha512==='UNKNOWN'
  }
  if(typeof x.generated_at!=='string'||!Number.isFinite(Date.parse(x.generated_at))||
     typeof source.manifest_sha256!=='string'||!hex.test(source.manifest_sha256)||
     typeof source.lock_sha256!=='string'||!hex.test(source.lock_sha256)||
     checks.manifest_lock_consistency!=='PASS')return false
  const counted=entries.filter(item=>item.integrity!=='sha512'||item.source!=='npm-registry').length
  return counted===summary.incomplete &&
    entries.filter(item=>item.integrity==='sha512').length===summary.sha512_integrity &&
    entries.filter(item=>item.source==='npm-registry').length===summary.registry_resolved &&
    checks.entries_registry_sha512===(counted===0?'PASS':'UNKNOWN')
}
export function provenanceIsStale(report:ProvenanceReport,now=Date.now()):boolean{
 if(!report.generated_at)return true
 const ms=Date.parse(report.generated_at)
 return !Number.isFinite(ms)||ms>now+5*60*1000||now-ms>48*60*60*1000
}
export async function fetchProvenance(signal:AbortSignal):Promise<ProvenanceReport>{
 const uri=new URL(`${import.meta.env.BASE_URL}provenance-report.json`,window.location.origin)
 const response=await fetch(uri,{credentials:'omit',cache:'no-store',signal})
 if(!response.ok)throw new Error('R7 lockfile inventory missing from deployed build')
 const result:unknown=await response.json()
 if(!isProvenanceReport(result))throw new Error('R7 report format inconsistent or invalid')
 return result
}
