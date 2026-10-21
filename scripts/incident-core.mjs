/**
 * R11 Incident Desk: deterministic, read-only triage of R10 postdeploy results.
 * This does not create issues, revert deployments, rotate credentials or page
 * humans. Packets are UNSIGNED operator aids, not authenticated incident logs.
 */
import { createHash } from 'node:crypto'

export const INCIDENT_SCHEMA='whitehatledger369.incident-packet.v1'
export const REPO='MichaelWave369/WhiteHatLedger369'
export const CUSTODY_SCHEMA='whitehatledger369.postdeploy-custody.v1'
export const STATE={
 NONE:'NO_CUSTODY_INCIDENT_OBSERVED',
 REVIEW:'REVIEW_REQUIRED',
 UNASSESSED:'UNASSESSED',
}
const HEX40=/^[a-f0-9]{40}$/
const HEX64=/^[a-f0-9]{64}$/
const RUN_ID=/^[1-9][0-9]{0,17}$/

function isObject(v){return v!==null&&typeof v==='object'&&!Array.isArray(v)}
const safe = value=>typeof value==='string'?value.replace(/[^A-Za-z0-9 _.:/-]/g,'_').slice(0,120):null
function checkContext(context){
 if(!isObject(context)||!HEX40.test(context.commit||'')||!RUN_ID.test(String(context.runId||''))||
    !HEX64.test(context.expectedManifestHash||''))
  throw new Error('R11_REQUIRES_RUN_COMMIT_AND_BUILD_DIGEST')
 return {
   repository:REPO,
   run_id:String(context.runId),
   source_commit:context.commit,
   expected_manifest_sha256:context.expectedManifestHash,
 }
}

export function classifyCustody(input,context){
 const source=checkContext(context)
 let state=STATE.UNASSESSED
 let evidence='MISSING_OR_INVALID_CUSTODY_OBSERVATION'
 let reason='No usable custody observation was produced. Operator must review the workflow.'
 let checked=null
 if(isObject(input)&&input.schema===CUSTODY_SCHEMA&&input.subject===REPO&&
    input.source_commit===source.source_commit&&
    input.expected_manifest_sha256===source.expected_manifest_sha256){
   if(input.conclusion==='BYTE_CUSTODY_MATCH'&&
      isObject(input.attestation)&&input.attestation.status==='VERIFIED_IN_GITHUB_CLI'&&
      isObject(input.served_manifest)&&input.served_manifest.status==='MATCH'&&
      isObject(input.hosted_assets)&&input.hosted_assets.status==='MATCH'&&
      Number.isSafeInteger(input.hosted_assets.total)&&input.hosted_assets.total>0&&
      input.hosted_assets.checked===input.hosted_assets.total&&
      Array.isArray(input.hosted_assets.mismatches)&&input.hosted_assets.mismatches.length===0){
     state=STATE.NONE
     evidence='R10_UNSIGNED_SUCCESS_OBSERVATION'
     reason='R10 reported signed-manifest/hosted-file byte equality. Does not certify deployment security.'
     checked=input.hosted_assets.total
   }else{
     state=STATE.REVIEW
     evidence='R10_CUSTODY_INCOMPLETE_OR_FAILED'
     reason='R10 did not establish a complete byte-custody match for this run.'
   }
 }else if(isObject(input)&&input.schema===CUSTODY_SCHEMA){
   state=STATE.REVIEW
   evidence='R10_CUSTODY_CONTEXT_MISMATCH'
   reason='A custody record exists but its repo, source commit or expected digest did not match this workflow.'
 }
 const id=createHash('sha256').update(JSON.stringify({
   schema:INCIDENT_SCHEMA,repository:source.repository,
   run_id:source.run_id,commit:source.source_commit,
   digest:source.expected_manifest_sha256,state,evidence,
 })).digest('hex').slice(0,20)

 const actions=[
  {id:'PRESERVE',label:'Preserve public evidence',detail:'Keep the GitHub Actions run, generated packet, manifest digest, and signing verification output. Do not edit the original run.'},
  {id:'ASSESS',label:'Independently verify the published manifest',detail:'Download manifest bytes. Verify gh attestation signer, exact main commit and build digest; compare all hosted asset hashes.'},
  {id:'DIAGNOSE',label:'Diagnose delivery discrepancy',detail:'Check Pages CDN propagation, source/commit confusion, missing assets, failed network checks or suspected unauthorized changes.'},
  {id:'AUTHORIZE',label:'Request explicit owner review before recovery',detail:'Review a candidate fix and separately authorize any redeploy, reset, rollback, key rotation or public communication. No automated mutation.'},
  {id:'RETEST',label:'Run fresh attestation and custody verification',detail:'A subsequent green run is new evidence only. It cannot erase the failed run or silently close an incident.'},
 ]
 return {
  schema:INCIDENT_SCHEMA,
  incident_id:'WHL-R11-'+id,
  ...source,
  state,
  evidence,
  summary:reason,
  reported_custody_checked_files:checked,
  custody_error_code:state===STATE.REVIEW?safe(input?.last_error)||'UNKNOWN':'NONE',
  deployment_timing:'POST_DEPLOY',
  deployment_already_occurred:true,
  may_have_delivered_unverified_bytes:state!==STATE.NONE,
  actions,
  operator_closure:'UNAVAILABLE_REQUIRES_SEPARATE_AUTHORIZED_REVIEW',
  allowed_automatic_actions:[],
  evidence_trust:'UNSIGNED_CI_RUN_OBSERVATION',
  disclaimer:'Incident classification and runbook are advisory. No rollback, issue creation, authorization or vulnerability diagnosis has occurred.',
 }
}

export function validateIncidentPacket(v){
 if(!isObject(v)||v.schema!==INCIDENT_SCHEMA||
    typeof v.incident_id!=='string'||!/^WHL-R11-[a-f0-9]{20}$/.test(v.incident_id)||
    v.repository!==REPO||!RUN_ID.test(String(v.run_id||''))||
    !HEX40.test(v.source_commit||'')||!HEX64.test(v.expected_manifest_sha256||'')||
    !Object.values(STATE).includes(v.state)||!Array.isArray(v.actions)||
    v.actions.length!==5||v.actions.some(a=>!isObject(a)||typeof a.id!=='string'||typeof a.label!=='string'||typeof a.detail!=='string')||
    v.evidence_trust!=='UNSIGNED_CI_RUN_OBSERVATION'||v.deployment_timing!=='POST_DEPLOY'||
    v.deployment_already_occurred!==true||v.operator_closure!=='UNAVAILABLE_REQUIRES_SEPARATE_AUTHORIZED_REVIEW'||
    !Array.isArray(v.allowed_automatic_actions)||v.allowed_automatic_actions.length!==0)return false
 const known=classifyCustody(null,{
  runId:v.run_id,commit:v.source_commit,expectedManifestHash:v.expected_manifest_sha256,
 })
 return known.incident_id===v.incident_id||v.state!==STATE.UNASSESSED
}
