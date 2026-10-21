/**
 * Browser-side R12 draft construction. A digest of an UNSIGNED JSON proposal
 * provides self-consistency only. It NEVER confers authority to deploy.
 */
export const RECOVERY_SCHEMA='whitehatledger369.recovery-proposal.v1' as const
export const RECOVERY_DOMAIN='WHL369-R12-RECOVERY-DRAFT-V1\n'
export const RECOVERY_REPO='MichaelWave369/WhiteHatLedger369'
export type IncidentState='REVIEW_REQUIRED'|'UNASSESSED'
export interface RecoveryFields {
 incident_id:string
 incident_state:IncidentState
 incident_run_id:string
 incident_commit:string
 incident_manifest_sha256:string
 candidate_commit:string
 candidate_manifest_sha256:string
 reason:string
 risk_and_impact:string
 prepared_at:string
 review_deadline:string
}
export interface RecoveryPayload extends RecoveryFields {
 schema:typeof RECOVERY_SCHEMA
 repository:typeof RECOVERY_REPO
 requested_action:'REQUEST_MANUAL_REDEPLOYMENT_REVIEW'
 candidate_verification:'UNVERIFIED_OPERATOR_CANDIDATE'
 approval:'NOT_GRANTED_REQUIRES_INDEPENDENT_OWNER_AUTHORIZATION'
 execution:'DISABLED_NO_TOOL_ACCESS'
}
export interface RecoveryProposal extends RecoveryPayload {
 proposal_id:string
 payload_sha256:string
 authority:'UNSIGNED_OPERATOR_DRAFT_ONLY'
 disclaimer:string
}
const fields=[
 'schema','repository','incident_id','incident_state','incident_run_id','incident_commit','incident_manifest_sha256',
 'candidate_commit','candidate_manifest_sha256','reason','risk_and_impact','prepared_at','review_deadline',
 'requested_action','candidate_verification','approval','execution',
] as const
const allFields=[...fields,'proposal_id','payload_sha256','authority','disclaimer']
const sha40=/^[a-f0-9]{40}$/
const sha64=/^[a-f0-9]{64}$/
const isObj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x)
const exact=(x:Record<string,unknown>,keys:readonly string[])=>Object.keys(x).length===keys.length&&Object.keys(x).every(k=>keys.includes(k))
const iso=(x:unknown):x is string=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x)&&
 Number.isFinite(Date.parse(x))&&new Date(Date.parse(x)).toISOString()===x
function isPayload(x:unknown):x is RecoveryPayload {
 if(!isObj(x)||!exact(x,fields)||
  x.schema!==RECOVERY_SCHEMA||x.repository!==RECOVERY_REPO||
  typeof x.incident_id!=='string'||!/^WHL-R11-[a-f0-9]{20}$/.test(x.incident_id)||
  (x.incident_state!=='REVIEW_REQUIRED'&&x.incident_state!=='UNASSESSED')||
  typeof x.incident_run_id!=='string'||!/^[1-9][0-9]{0,17}$/.test(x.incident_run_id)||
  typeof x.incident_commit!=='string'||!sha40.test(x.incident_commit)||
  typeof x.incident_manifest_sha256!=='string'||!sha64.test(x.incident_manifest_sha256)||
  typeof x.candidate_commit!=='string'||!sha40.test(x.candidate_commit)||
  typeof x.candidate_manifest_sha256!=='string'||!sha64.test(x.candidate_manifest_sha256)||
  x.candidate_commit===x.incident_commit||
  typeof x.reason!=='string'||x.reason.trim().length<12||x.reason.length>500||
  typeof x.risk_and_impact!=='string'||x.risk_and_impact.trim().length<12||x.risk_and_impact.length>500||
  !iso(x.prepared_at)||!iso(x.review_deadline)||
  Date.parse(x.review_deadline)<=Date.parse(x.prepared_at)||
  Date.parse(x.review_deadline)-Date.parse(x.prepared_at)>72*3600*1000||
  x.requested_action!=='REQUEST_MANUAL_REDEPLOYMENT_REVIEW'||
  x.candidate_verification!=='UNVERIFIED_OPERATOR_CANDIDATE'||
  x.approval!=='NOT_GRANTED_REQUIRES_INDEPENDENT_OWNER_AUTHORIZATION'||
  x.execution!=='DISABLED_NO_TOOL_ACCESS')return false
 return true
}
function canonical(p:RecoveryPayload):string {
 return JSON.stringify(Object.fromEntries(fields.map(k=>[k,p[k]])))
}
async function hash(value:string){
 const bytes=new TextEncoder().encode(value)
 const digest=await crypto.subtle.digest('SHA-256',bytes as BufferSource)
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')
}
export async function createDraft(input:RecoveryFields):Promise<RecoveryProposal> {
 const p:RecoveryPayload={
  schema:RECOVERY_SCHEMA,repository:RECOVERY_REPO,
  ...input,requested_action:'REQUEST_MANUAL_REDEPLOYMENT_REVIEW',
  candidate_verification:'UNVERIFIED_OPERATOR_CANDIDATE',
  approval:'NOT_GRANTED_REQUIRES_INDEPENDENT_OWNER_AUTHORIZATION',
  execution:'DISABLED_NO_TOOL_ACCESS',
 }
 if(!isPayload(p))throw new Error('Invalid incident, full commit/digest, review window, or scope. Complete every field.')
 if(!crypto?.subtle)throw new Error('Browser SHA-256 unavailable; no draft can be fingerprinted.')
 const digest=await hash(RECOVERY_DOMAIN+canonical(p))
 return {...p,proposal_id:'WHL-R12-'+digest.slice(0,20),payload_sha256:digest,
  authority:'UNSIGNED_OPERATOR_DRAFT_ONLY',
  disclaimer:'SHA-256 detects accidental edits relative to this draft, not who authored it. This is not signed owner approval; no rollback, deploy, or write action is authorized.',
 }
}
export type DraftVerdict={status:'DRAFT_INTEGRITY_MATCH'|'REJECTED';reason:string;authorizes_deployment:false}
export async function inspectDraft(x:unknown,at:Date|null=null):Promise<DraftVerdict> {
 const deny=(reason:string):DraftVerdict=>({status:'REJECTED',reason,authorizes_deployment:false})
 if(!isObj(x)||!exact(x,allFields)||!isPayload(Object.fromEntries(fields.map(k=>[k,x[k]])))||
   x.authority!=='UNSIGNED_OPERATOR_DRAFT_ONLY'||typeof x.disclaimer!=='string'||x.disclaimer.length<30||
   typeof x.proposal_id!=='string'||typeof x.payload_sha256!=='string')return deny('INVALID_FIELDS_OR_AUTHORITY')
 if(!crypto?.subtle)return deny('SHA256_UNAVAILABLE')
 const digest=await hash(RECOVERY_DOMAIN+canonical(x as unknown as RecoveryPayload))
 if(x.payload_sha256!==digest||x.proposal_id!=='WHL-R12-'+digest.slice(0,20))
   return deny('DRAFT_DIGEST_MISMATCH')
 if(at!==null&&(!Number.isFinite(at.getTime())||at.getTime()>=Date.parse(x.review_deadline as string)))
   return deny('REVIEW_DEADLINE_EXPIRED')
 return {status:'DRAFT_INTEGRITY_MATCH',reason:'UNSIGNED_NON_AUTHORITATIVE_PROPOSAL',authorizes_deployment:false}
}
