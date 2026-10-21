/**
 * R12 offline recovery proposal validation. This deliberately produces
 * UNSIGNED DRAFTS ONLY, with no permission to execute a deployment.
 */
import {createHash} from 'node:crypto'

export const RECOVERY_SCHEMA='whitehatledger369.recovery-proposal.v1'
export const OWNER_REPO='MichaelWave369/WhiteHatLedger369'
export const DOMAIN='WHL369-R12-RECOVERY-DRAFT-V1\n'
export const MAX_TTL_MS=72*60*60*1000
const sha=/^[a-f0-9]{40}$/
const hash=/^[a-f0-9]{64}$/
const incident=/^WHL-R11-[a-f0-9]{20}$/
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)
const iso=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x)&&
 Number.isFinite(Date.parse(x))&&new Date(Date.parse(x)).toISOString()===x
const keys=(o,fields)=>isObj(o)&&Object.keys(o).length===fields.length&&Object.keys(o).every(k=>fields.includes(k))
const payloadFields=['schema','repository','incident_id','incident_state','incident_run_id','incident_commit','incident_manifest_sha256',
 'candidate_commit','candidate_manifest_sha256','reason','risk_and_impact','prepared_at','review_deadline',
 'requested_action','candidate_verification','approval','execution']

export function canonicalRecoveryPayload(p){
 if(!keys(p,payloadFields))throw new Error('UNEXPECTED_DRAFT_FIELDS')
 return JSON.stringify(Object.fromEntries(payloadFields.map(key=>[key,p[key]])))
}
export const sha256=x=>createHash('sha256').update(x,'utf8').digest('hex')
function validDraftFields(p){
 if(!keys(p,payloadFields)||p.schema!==RECOVERY_SCHEMA||p.repository!==OWNER_REPO||
    !incident.test(p.incident_id||'')||!['REVIEW_REQUIRED','UNASSESSED'].includes(p.incident_state)||
    !/^[1-9][0-9]{0,17}$/.test(String(p.incident_run_id||''))||
    !sha.test(p.incident_commit||'')||!hash.test(p.incident_manifest_sha256||'')||
    !sha.test(p.candidate_commit||'')||!hash.test(p.candidate_manifest_sha256||'')||
    p.incident_commit===p.candidate_commit||
    typeof p.reason!=='string'||p.reason.trim().length<12||p.reason.length>500||
    typeof p.risk_and_impact!=='string'||p.risk_and_impact.trim().length<12||p.risk_and_impact.length>500||
    !iso(p.prepared_at)||!iso(p.review_deadline)||
    Date.parse(p.review_deadline)<=Date.parse(p.prepared_at)||
    Date.parse(p.review_deadline)-Date.parse(p.prepared_at)>MAX_TTL_MS||
    p.requested_action!=='REQUEST_MANUAL_REDEPLOYMENT_REVIEW'||
    p.candidate_verification!=='UNVERIFIED_OPERATOR_CANDIDATE'||
    p.approval!=='NOT_GRANTED_REQUIRES_INDEPENDENT_OWNER_AUTHORIZATION'||
    p.execution!=='DISABLED_NO_TOOL_ACCESS')return false
 return true
}
export function createRecoveryProposal(fields){
 if(!isObj(fields))throw new Error('INVALID_DRAFT_INPUT')
 const p={
  schema:RECOVERY_SCHEMA,repository:OWNER_REPO,
  incident_id:fields.incident_id,
  incident_state:fields.incident_state,
  incident_run_id:String(fields.incident_run_id??''),
  incident_commit:fields.incident_commit,
  incident_manifest_sha256:fields.incident_manifest_sha256,
  candidate_commit:fields.candidate_commit,
  candidate_manifest_sha256:fields.candidate_manifest_sha256,
  reason:fields.reason,
  risk_and_impact:fields.risk_and_impact,
  prepared_at:fields.prepared_at,
  review_deadline:fields.review_deadline,
  requested_action:'REQUEST_MANUAL_REDEPLOYMENT_REVIEW',
  candidate_verification:'UNVERIFIED_OPERATOR_CANDIDATE',
  approval:'NOT_GRANTED_REQUIRES_INDEPENDENT_OWNER_AUTHORIZATION',
  execution:'DISABLED_NO_TOOL_ACCESS',
 }
 if(!validDraftFields(p))throw new Error('INVALID_OR_OUT_OF_SCOPE_RECOVERY_DRAFT')
 const digest=sha256(DOMAIN+canonicalRecoveryPayload(p))
 return {
  ...p,proposal_id:'WHL-R12-'+digest.slice(0,20),
  payload_sha256:digest,
  authority:'UNSIGNED_OPERATOR_DRAFT_ONLY',
  disclaimer:'SHA-256 detects accidental edits relative to this draft, not who authored it. This is not signed owner approval; no rollback, deploy, or write action is authorized.',
 }
}
export function validateRecoveryProposal(x,{at=null}={}){
 if(!isObj(x)||!keys(x,[...payloadFields,'proposal_id','payload_sha256','authority','disclaimer'])||
    !validDraftFields(Object.fromEntries(payloadFields.map(key=>[key,x[key]])))||x.authority!=='UNSIGNED_OPERATOR_DRAFT_ONLY'||
    typeof x.disclaimer!=='string'||x.disclaimer.length<30||
    typeof x.proposal_id!=='string'||typeof x.payload_sha256!=='string')return {status:'REJECTED',reason:'INVALID_FIELDS_OR_AUTHORITY'}
 const hashValue=sha256(DOMAIN+canonicalRecoveryPayload(x))
 if(x.payload_sha256!==hashValue||x.proposal_id!=='WHL-R12-'+hashValue.slice(0,20))
  return {status:'REJECTED',reason:'DRAFT_DIGEST_MISMATCH'}
 if(at!==null){
  const moment=at instanceof Date?at.getTime():Date.parse(at)
  if(!Number.isFinite(moment)||moment>=Date.parse(x.review_deadline))
   return {status:'REJECTED',reason:'REVIEW_DEADLINE_EXPIRED'}
 }
 return {status:'DRAFT_INTEGRITY_MATCH',reason:'UNSIGNED_NON_AUTHORITATIVE_PROPOSAL',authorizes_deployment:false}
}
