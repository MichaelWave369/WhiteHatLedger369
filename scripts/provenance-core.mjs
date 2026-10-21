import { createHash } from 'node:crypto'

export const PROVENANCE_SCHEMA='whitehatledger369.lock-inventory.v1'
export const SOURCE_SUBJECT='MichaelWave369/WhiteHatLedger369'
const sections=['dependencies','devDependencies','optionalDependencies']
const digest=raw=>createHash('sha256').update(raw,'utf8').digest('hex')
const sha512Integrity=/^sha512-[A-Za-z0-9+/]+={0,2}$/
const safeName=/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)
const allowedSource=resolved=>typeof resolved==='string'&&resolved.startsWith('https://registry.npmjs.org/')
const sectionValue=(o,k)=>isObj(o?.[k])?o[k]:{}
const shaPattern=/^[a-f0-9]{64}$/

export function parseLockInventory(manifestText,lockText){
  let manifest,lock
  try{
    manifest=JSON.parse(manifestText)
    lock=JSON.parse(lockText)
  }catch{
    throw new Error('INVALID_JSON: manifest or lockfile malformed')
  }
  if(!isObj(manifest)||!isObj(lock)||lock.lockfileVersion!==3||
     !isObj(lock.packages)||!isObj(lock.packages[''])||
     lock.name!==manifest.name||lock.version!==manifest.version||
     lock.packages[''].name!==manifest.name||lock.packages[''].version!==manifest.version)
    throw new Error('LOCKFILE_ROOT_MISMATCH: npm v3 lock root inconsistent with package.json')

  for(const key of sections){
    if(manifest[key]!==undefined&&!isObj(manifest[key]))
      throw new Error('INVALID_MANIFEST_SECTION: '+key)
    const declared=sectionValue(manifest,key), frozen=sectionValue(lock.packages[''],key)
    if(Object.keys(declared).length!==Object.keys(frozen).length)
      throw new Error('LOCKFILE_DEPENDENCY_MISMATCH: '+key)
    for(const [name,version] of Object.entries(declared)){
      if(typeof version!=='string'||frozen[name]!==version)
        throw new Error('LOCKFILE_DEPENDENCY_MISMATCH: '+name)
    }
  }

  const paths=Object.entries(lock.packages)
  if(paths.length<2||paths.length>20000)
    throw new Error('INVALID_LOCKFILE_SIZE')
  const entries=[]
  const seen=new Set()
  for(const [path,details] of paths){
    if(path==='')continue
    if(!path.startsWith('node_modules/')||path.includes('..')||seen.has(path)||!isObj(details)){
      throw new Error('INVALID_LOCK_ENTRY_PATH: '+String(path).slice(0,100))
    }
    seen.add(path)
    const name=path.split('node_modules/').at(-1)
    if(!safeName.test(name)||typeof details.version!=='string'||details.version.length>128)
      throw new Error('INVALID_LOCK_ENTRY_METADATA: '+String(path).slice(0,100))
    const registrySource=allowedSource(details.resolved)
    const sriSha512=typeof details.integrity==='string'&&sha512Integrity.test(details.integrity)
    entries.push({
      path,name,version:details.version,
      license:typeof details.license==='string'?details.license.slice(0,160):null,
      source:registrySource?'npm-registry':'other-or-unverified',
      integrity:sriSha512?'sha512':'missing-or-other',
      integrityValue:sriSha512?details.integrity:null,
      development:details.dev===true,
      optional:details.optional===true,
    })
  }
  entries.sort((a,b)=>a.path.localeCompare(b.path))
  const incomplete=entries.filter(x=>x.integrity!=='sha512'||x.source!=='npm-registry').length
  return {
    entries,
    summary:{
      locked_entries:entries.length,
      sha512_integrity:entries.filter(x=>x.integrity==='sha512').length,
      registry_resolved:entries.filter(x=>x.source==='npm-registry').length,
      development_entries:entries.filter(x=>x.development).length,
      optional_entries:entries.filter(x=>x.optional).length,
      incomplete,
    },
    source:{manifest_sha256:digest(manifestText),lock_sha256:digest(lockText)},
  }
}

export function buildProvenanceReport(manifestText,lockText,{
  now=()=>new Date(),commit=null,nodeVersion=process.version,
}={}){
  const data=parseLockInventory(manifestText,lockText)
  const date=now()
  if(!(date instanceof Date)||!Number.isFinite(date.getTime()))
    throw new Error('INVALID_TIMESTAMP')
  return {
    schema:PROVENANCE_SCHEMA,
    subject:SOURCE_SUBJECT,
    generated_at:date.toISOString(),
    source:{
      ...data.source,
      git_commit:typeof commit==='string'&&/^[a-f0-9]{40}$/.test(commit)?commit:null,
      environment_node:typeof nodeVersion==='string'?nodeVersion:null,
      integrity:'UNSIGNED_CI_SOURCE_CLAIM',
    },
    scope:'npm lockfile v3 entries including platform-optional and development packages; not observed deployed installations',
    summary:data.summary,
    entries:data.entries,
    checks:{
      manifest_lock_consistency:'PASS',
      entries_registry_sha512:data.summary.incomplete===0?'PASS':'UNKNOWN',
      deployed_artifact_provenance:'UNKNOWN',
      installed_tree_attestation:'UNKNOWN',
    },
    disclaimer:'Unsigned lockfile inventory and registry integrity metadata. Not independently attested; does not prove the installed/deployed tree or absence of vulnerabilities.',
  }
}
export function isReportInternallyConsistent(report){
  if(!isObj(report)||report.schema!==PROVENANCE_SCHEMA||
     report.subject!==SOURCE_SUBJECT||!isObj(report.source)||
     !shaPattern.test(report.source.manifest_sha256||'')||
     !shaPattern.test(report.source.lock_sha256||'')||
     !isObj(report.summary)||!Array.isArray(report.entries)||
     !isObj(report.checks)||report.checks.deployed_artifact_provenance!=='UNKNOWN'||
     report.checks.installed_tree_attestation!=='UNKNOWN'||report.checks.manifest_lock_consistency!=='PASS')
    return false
  const {summary,entries}=report
  if(!['locked_entries','sha512_integrity','registry_resolved','development_entries','optional_entries','incomplete'].every(k=>Number.isSafeInteger(summary[k])&&summary[k]>=0))
    return false
  return summary.locked_entries===entries.length &&
    summary.sha512_integrity+summary.incomplete>=entries.length &&
    summary.incomplete===entries.filter(x=>x.integrity!=='sha512'||x.source!=='npm-registry').length &&
    report.checks.entries_registry_sha512===(summary.incomplete===0?'PASS':'UNKNOWN')
}
