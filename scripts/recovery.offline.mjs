import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRecoveryProposal,validateRecoveryProposal,canonicalRecoveryPayload,sha256,DOMAIN} from './recovery-core.mjs'

const input={
 incident_id:'WHL-R11-'+'a'.repeat(20),incident_state:'REVIEW_REQUIRED',
 incident_run_id:'1234567890',incident_commit:'b'.repeat(40),
 incident_manifest_sha256:'c'.repeat(64),
 candidate_commit:'d'.repeat(40),candidate_manifest_sha256:'e'.repeat(64),
 reason:'A synthetic custody test reported mismatched bytes.',
 risk_and_impact:'Potential stale files; assess user impact before any recovery.',
 prepared_at:'2026-10-21T12:00:00.000Z',review_deadline:'2026-10-22T12:00:00.000Z',
}
test('R12 prepares deterministic non-authoritative review packet with exact refs',()=>{
 const a=createRecoveryProposal(input),b=createRecoveryProposal(input)
 assert.deepEqual(a,b)
 assert.match(a.proposal_id,/^WHL-R12-[a-f0-9]{20}$/)
 assert.equal(a.authority,'UNSIGNED_OPERATOR_DRAFT_ONLY')
 assert.equal(a.approval,'NOT_GRANTED_REQUIRES_INDEPENDENT_OWNER_AUTHORIZATION')
 assert.equal(a.execution,'DISABLED_NO_TOOL_ACCESS')
 assert.equal(a.candidate_verification,'UNVERIFIED_OPERATOR_CANDIDATE')
 assert.deepEqual(validateRecoveryProposal(a,{at:'2026-10-21T20:00:00.000Z'}),{
   status:'DRAFT_INTEGRITY_MATCH',reason:'UNSIGNED_NON_AUTHORITATIVE_PROPOSAL',authorizes_deployment:false,
 })
 const {proposal_id,payload_sha256,authority,disclaimer,...payload}=a
 assert.ok(proposal_id&&payload_sha256&&authority&&disclaimer)
 assert.equal(sha256(DOMAIN+canonicalRecoveryPayload(payload)),a.payload_sha256)
})
test('sha mutation, unsigned overrides, unknown fields and forged approval fail closed',()=>{
 const a=createRecoveryProposal(input)
 assert.equal(validateRecoveryProposal({...a,reason:a.reason+' EDIT'}).reason,'DRAFT_DIGEST_MISMATCH')
 assert.equal(validateRecoveryProposal({...a,approval:'APPROVED'}).status,'REJECTED')
 assert.equal(validateRecoveryProposal({...a,execution:'ROLLBACK_NOW'}).status,'REJECTED')
 assert.equal(validateRecoveryProposal({...a,extra:'CLAIM'}).status,'REJECTED')
 assert.equal(validateRecoveryProposal({...a,proposal_id:'WHL-R12-'+'0'.repeat(20)}).status,'REJECTED')
})
test('no self-targeting, cross-repo references, truncated hashes or fake incident states',()=>{
 assert.throws(()=>createRecoveryProposal({...input,candidate_commit:input.incident_commit}),/OUT_OF_SCOPE/)
 assert.throws(()=>createRecoveryProposal({...input,incident_commit:'bad'}),/OUT_OF_SCOPE/)
 assert.throws(()=>createRecoveryProposal({...input,incident_state:'NO_CUSTODY_INCIDENT_OBSERVED'}),/OUT_OF_SCOPE/)
 assert.throws(()=>createRecoveryProposal({...input,incident_id:'not-an-incident'}),/OUT_OF_SCOPE/)
 assert.throws(()=>createRecoveryProposal({...input,review_deadline:'2026-10-29T12:00:00.000Z'}),/OUT_OF_SCOPE/)
})
test('draft review deadline expires, not to be interpreted as a renewable permission',()=>{
 const p=createRecoveryProposal(input)
 assert.equal(validateRecoveryProposal(p,{at:'2026-10-22T12:00:00.000Z'}).reason,'REVIEW_DEADLINE_EXPIRED')
 assert.equal(validateRecoveryProposal(p,{at:'not time'}).reason,'REVIEW_DEADLINE_EXPIRED')
})
test('workflow cannot deploy or claim approval based on proposals',()=>{
 const pages=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8')
 const ci=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8')
 assert.doesNotMatch(pages,/node scripts\/recovery-verify\.mjs/)
 assert.doesNotMatch(pages,/REQUEST_MANUAL_REDEPLOYMENT_REVIEW/)
 assert.match(ci,/permissions:\s*\n\s*contents: read/)
 assert.doesNotMatch(ci,/issues: write/)
 assert.doesNotMatch(ci,/contents: write/)
})
