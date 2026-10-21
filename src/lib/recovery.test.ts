import {describe,it,expect} from 'vitest'
import {createDraft,inspectDraft,type RecoveryFields} from './recovery'

const input:RecoveryFields={
 incident_id:'WHL-R11-'+'a'.repeat(20),incident_state:'REVIEW_REQUIRED',
 incident_run_id:'1234567890',incident_commit:'b'.repeat(40),
 incident_manifest_sha256:'c'.repeat(64),candidate_commit:'d'.repeat(40),
 candidate_manifest_sha256:'e'.repeat(64),
 reason:'An example hosted-byte mismatch needs human investigation.',
 risk_and_impact:'An outdated page may have been served; assess impact before changing deployment.',
 prepared_at:'2026-10-21T12:00:00.000Z',review_deadline:'2026-10-22T12:00:00.000Z',
}
describe('R12 browser recovery drafts',()=>{
 it('produces deterministic draft digest but NEVER an authorized operation',async()=>{
  const one=await createDraft(input)
  const two=await createDraft(input)
  expect(one).toEqual(two)
  expect(one.execution).toBe('DISABLED_NO_TOOL_ACCESS')
  expect(one.approval).toMatch(/NOT_GRANTED/)
  expect(await inspectDraft(one,new Date('2026-10-21T15:00:00.000Z'))).toEqual({
   status:'DRAFT_INTEGRITY_MATCH',reason:'UNSIGNED_NON_AUTHORITATIVE_PROPOSAL',authorizes_deployment:false,
  })
 })
 it('rejects tampered, forged, or expanded envelopes',async()=>{
  const draft=await createDraft(input)
  expect((await inspectDraft({...draft,reason:'edited reason is still long enough'})).status).toBe('REJECTED')
  expect((await inspectDraft({...draft,approval:'GRANTED'})).status).toBe('REJECTED')
  expect((await inspectDraft({...draft,execution:'DO_ROLLBACK'})).status).toBe('REJECTED')
  expect((await inspectDraft({...draft,extra:'injected'})).status).toBe('REJECTED')
 })
 it('only accepts a separate full commit target and actual incident context',async()=>{
  await expect(createDraft({...input,candidate_commit:input.incident_commit})).rejects.toThrow()
  await expect(createDraft({...input,incident_id:'not real'})).rejects.toThrow()
  await expect(createDraft({...input,incident_state:'NO_CUSTODY_INCIDENT_OBSERVED' as RecoveryFields['incident_state']})).rejects.toThrow()
 })
 it('rejects expired review windows, still without implying authorization',async()=>{
  const draft=await createDraft(input)
  expect((await inspectDraft(draft,new Date('2026-10-22T12:00:00.000Z'))).reason).toBe('REVIEW_DEADLINE_EXPIRED')
 })
})
