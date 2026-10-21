import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {classifyCustody,validateIncidentPacket,STATE} from './incident-core.mjs'

const context={
 commit:'a'.repeat(40),runId:'987654321',expectedManifestHash:'b'.repeat(64),
}
const good={
 schema:'whitehatledger369.postdeploy-custody.v1',
 subject:'MichaelWave369/WhiteHatLedger369',
 source_commit:context.commit,expected_manifest_sha256:context.expectedManifestHash,
 conclusion:'BYTE_CUSTODY_MATCH',
 attestation:{status:'VERIFIED_IN_GITHUB_CLI'},
 served_manifest:{status:'MATCH'},
 hosted_assets:{status:'MATCH',checked:3,total:3,mismatches:[]},
}
test('complete signed-manifest plus hosted-byte report only avoids opening new incident',()=>{
 const packet=classifyCustody(good,context)
 assert.equal(packet.state,STATE.NONE)
 assert.equal(packet.reported_custody_checked_files,3)
 assert.equal(packet.allowed_automatic_actions.length,0)
 assert.equal(validateIncidentPacket(packet),true)
 assert.equal(packet.deployment_already_occurred,true)
})
test('unavailable report is UNASSESSED, never resolved or passing',()=>{
 const packet=classifyCustody(null,context)
 assert.equal(packet.state,STATE.UNASSESSED)
 assert.equal(packet.may_have_delivered_unverified_bytes,true)
 assert.match(packet.operator_closure,/REQUIRES_SEPARATE_AUTHORIZED_REVIEW/)
 assert.equal(validateIncidentPacket(packet),true)
})
test('failed or partial custody receipt requires human review',()=>{
 const failure={
  schema:good.schema,subject:good.subject,source_commit:context.commit,
  expected_manifest_sha256:context.expectedManifestHash,
  conclusion:'UNKNOWN_OR_FAILED',last_error:'HOSTED_ASSETS_DO_NOT_MATCH_ATTESTED_MANIFEST',
 }
 const packet=classifyCustody(failure,context)
 assert.equal(packet.state,STATE.REVIEW)
 assert.match(packet.custody_error_code,/HOSTED_ASSETS/)
 assert.equal(validateIncidentPacket(packet),true)
})
test('mismatched run commit or expected manifest cannot be an accepted success',()=>{
 for(const v of [
  {...good,source_commit:'c'.repeat(40)},
  {...good,expected_manifest_sha256:'d'.repeat(64)},
  {...good,hosted_assets:{...good.hosted_assets,checked:2}},
  {...good,attestation:{status:'UNKNOWN'}},
  {...good,hosted_assets:{...good.hosted_assets,mismatches:[{path:'index.html'}]}},
 ]){
  assert.notEqual(classifyCustody(v,context).state,STATE.NONE)
 }
})
test('records are deterministically identified and do not auto-resolve prior incidents',()=>{
 const a=classifyCustody(good,context)
 const b=classifyCustody(good,context)
 assert.equal(a.incident_id,b.incident_id)
 assert.equal(a.actions.at(-1).id,'RETEST')
 assert.equal(a.operator_closure,'UNAVAILABLE_REQUIRES_SEPARATE_AUTHORIZED_REVIEW')
 assert.ok(a.actions.every(action=>!action.detail.includes('automatically')))
})
test('invalid or missing source commit / run id is not silently admitted',()=>{
 assert.throws(()=>classifyCustody(good,{...context,commit:'invalid'}),/REQUIRES_RUN/)
 assert.throws(()=>classifyCustody(good,{...context,runId:'not numeric'}),/REQUIRES_RUN/)
 assert.throws(()=>classifyCustody(good,{...context,expectedManifestHash:'no hash'}),/REQUIRES_RUN/)
})
test('the workflow is read-only, always captures incident packet and preserves R10 failure',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8')
 const custody=workflow.split('\n  custody:\n')[1]
 assert.ok(custody)
 assert.match(custody,/permissions:\s*\n\s*contents: read\s*\n\s*attestations: read/)
 assert.doesNotMatch(custody,/issues: write|contents: write|id-token: write/)
 assert.match(custody,/node scripts\/incident\.mjs/)
 assert.match(custody,/if: always\(\)/)
 assert.match(custody,/incident-report\.json/)
 assert.doesNotMatch(custody,/continue-on-error: true/)
})
