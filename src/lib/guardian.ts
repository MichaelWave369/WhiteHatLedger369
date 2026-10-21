export type GuardStatus = 'PASS'|'FAIL'|'UNKNOWN'
export interface GuardCheck {
 id:string
 label:string
 status:GuardStatus
 detail:string
 scope:string
}
export interface GuardianReport {
 schema:'whitehatledger369.guardian.v1'
 policy:'r6-advisory-2026-10'
 subject:'MichaelWave369/WhiteHatLedger369'
 generated_at:string|null
 source:{commit:string|null;manifest_sha256:string|null;integrity:'UNATTESTED_CI_ENVIRONMENT_CLAIM'}
 mode:'ADVISORY_ONLY'
 deployment_blocking:false
 production_release:{status:GuardStatus;detail:string}
 controls:GuardCheck[]
 demonstration:GuardCheck
 disclaimer:string
}
const isObject=(v:unknown):v is Record<string,unknown>=>Boolean(v&&typeof v==='object'&&!Array.isArray(v))
const isStatus=(v:unknown):v is GuardStatus=>v==='PASS'||v==='FAIL'||v==='UNKNOWN'
function isCheck(v:unknown):v is GuardCheck {
 return isObject(v)&&typeof v.id==='string'&&typeof v.label==='string'&&
    isStatus(v.status)&&typeof v.detail==='string'&&typeof v.scope==='string'
}
export function aggregatePolicy(statuses: readonly GuardStatus[]):GuardStatus {
 if(statuses.length===0)return 'UNKNOWN'
 if(statuses.includes('FAIL'))return 'FAIL'
 if(statuses.includes('UNKNOWN'))return 'UNKNOWN'
 return 'PASS'
}
const REQUIRED=['direct_npm_advisories','transitive_sbom','deployment_attestation','authorized_scope','patch_retest']
const UNKNOWN_ONLY=new Set(['transitive_sbom','deployment_attestation','authorized_scope','patch_retest'])
export function validateGuardian(input:unknown): input is GuardianReport {
 if(!isObject(input)||input.schema!=='whitehatledger369.guardian.v1'||
    input.policy!=='r6-advisory-2026-10'||input.subject!=='MichaelWave369/WhiteHatLedger369'||
    input.mode!=='ADVISORY_ONLY'||input.deployment_blocking!==false||
    !isObject(input.production_release)||!isStatus(input.production_release.status)||
    typeof input.production_release.detail!=='string'||
    !isObject(input.source)||input.source.integrity!=='UNATTESTED_CI_ENVIRONMENT_CLAIM'||
    !(input.source.commit===null||(typeof input.source.commit==='string'&&/^[a-f0-9]{40}$/.test(input.source.commit)))||
    !(input.source.manifest_sha256===null||(typeof input.source.manifest_sha256==='string'&&/^[a-f0-9]{64}$/.test(input.source.manifest_sha256)))||
    !isCheck(input.demonstration)||input.demonstration.id!=='demo_receipt_integrity'||
    !Array.isArray(input.controls)||!input.controls.every(isCheck)||
    typeof input.disclaimer!=='string')return false

 if(input.generated_at!==null && (typeof input.generated_at!=='string'||
    !Number.isFinite(Date.parse(input.generated_at))))return false

 // The production controls are fixed and a synthetic fixture is forbidden
 // from being included in a release decision.
 if(input.controls.length===0) {
   return input.generated_at===null &&
     input.production_release.status==='UNKNOWN' && input.demonstration.status==='UNKNOWN'
 }
 if(input.controls.length!==REQUIRED.length)return false
 if(input.controls.some((c,i)=>c.id!==REQUIRED[i]||
    (UNKNOWN_ONLY.has(c.id)&&c.status!=='UNKNOWN')))return false
 return input.production_release.status===aggregatePolicy(input.controls.map(c=>c.status))
}
export function guardianIsStale(report:GuardianReport, now=Date.now()):boolean {
 if(!report.generated_at)return true
 const date=Date.parse(report.generated_at)
 return !Number.isFinite(date)||date>now+5*60*1000||now-date>48*60*60*1000
}
export async function fetchGuardian(signal:AbortSignal):Promise<GuardianReport> {
 const path=new URL(`${import.meta.env.BASE_URL}guardian-report.json`,window.location.origin)
 const result=await fetch(path,{signal,credentials:'omit',cache:'no-store'})
 if(!result.ok)throw new Error('Release Guardian evidence report not available.')
 const content:unknown=await result.json()
 if(!validateGuardian(content))throw new Error('Release Guardian report invalid, inconsistent, or out of policy.')
 return content
}

export type DemoMode='all-pass'|'unknown'|'fail'
export function simulatePolicy(mode:DemoMode):{input:GuardStatus[];status:GuardStatus;note:string}{
 const input:GuardStatus[]=mode==='all-pass'?['PASS','PASS','PASS']:
   mode==='unknown'?['PASS','UNKNOWN','PASS']:['PASS','FAIL','UNKNOWN']
 return {
   input,
   status:aggregatePolicy(input),
   note:mode==='all-pass'
     ? 'All three purely synthetic controls satisfy this tiny toy policy; this is NOT a production release clearance.'
     :mode==='unknown'
     ? 'Missing one evidence claim keeps the toy policy UNKNOWN. No implied consent or verification.'
     : 'One failing synthetic control is enough for FAIL, even when another claim is unknown.',
 }
}
