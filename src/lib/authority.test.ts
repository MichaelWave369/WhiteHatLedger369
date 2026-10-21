import { describe, expect, it } from 'vitest'
import {
 AUTHORITY_DEMO_CLOCK, FixtureAuthoritySession, SIGNED_FIXTURE,
 sampleAuthorityRequest, verifyFixtureAuthority, runAuthorityScenario, SCENARIOS,
} from './authority'

describe('R4 signed sample authority', () => {
  it('verifies an actual Ed25519 signature against the pinned demo public key', async () => {
    const verdict = await verifyFixtureAuthority({ ...SIGNED_FIXTURE }, sampleAuthorityRequest(), new FixtureAuthoritySession())
    expect(verdict).toEqual({
      signature: 'VALID', decision: 'ALLOW_FIXTURE_ONLY', reason: 'SIGNATURE_VERIFIED',
      executed: false, scope: 'SIGNED_SAMPLE_ONLY',
    })
  })
  it('enforces all seven positive and negative control cases', async () => {
    const all = await Promise.all(SCENARIOS.map(s => runAuthorityScenario(s.id)))
    expect(all).toHaveLength(7)
    expect(all.every(s => s.matchedExpectation)).toBe(true)
    expect(all.map(s => [s.scenario,s.verdict.reason])).toEqual([
      ['valid','SIGNATURE_VERIFIED'],
      ['tamper','SIGNATURE_INVALID'],
      ['wrong-key','KEY_NOT_TRUSTED'],
      ['wrong-resource','RESOURCE_MISMATCH'],
      ['denied-op','OPERATION_DENIED'],
      ['expired','EXPIRED'],
      ['replay','REPLAY'],
    ])
  })
  it('expired sample stays signature-valid but denies permission', async () => {
    const request = sampleAuthorityRequest('2026-10-22T00:00:00.000Z')
    const verdict = await verifyFixtureAuthority({ ...SIGNED_FIXTURE }, request, new FixtureAuthoritySession())
    expect(verdict).toMatchObject({ signature: 'VALID', decision:'DENY',reason:'EXPIRED',executed:false })
  })
  it('fails closed on wrong audience and subject', async () => {
    const req = sampleAuthorityRequest()
    expect((await verifyFixtureAuthority({ ...SIGNED_FIXTURE }, {...req,audience:'superphivessel-production'},new FixtureAuthoritySession())).reason).toBe('AUDIENCE_MISMATCH')
    expect((await verifyFixtureAuthority({ ...SIGNED_FIXTURE }, {...req,subject:'different-agent'},new FixtureAuthoritySession())).reason).toBe('SUBJECT_MISMATCH')
  })
  it('rejects modified payload, not trusting text fields as authority', async () => {
    const bad = { ...SIGNED_FIXTURE, payload: SIGNED_FIXTURE.payload.replace('simulated-spv-agent','system-agent') }
    expect((await verifyFixtureAuthority(bad, sampleAuthorityRequest(),new FixtureAuthoritySession())).reason).toBe('SIGNATURE_INVALID')
  })
  it('rejects invalid envelopes and non-ready lease clocks', async () => {
    const s = new FixtureAuthoritySession()
    expect((await verifyFixtureAuthority({...SIGNED_FIXTURE,signature:'invalid!!!!'},sampleAuthorityRequest(),s)).decision).toBe('DENY')
    expect((await verifyFixtureAuthority({...SIGNED_FIXTURE},sampleAuthorityRequest('2026-10-20T12:00:00.000Z'),s)).reason).toBe('NOT_YET_VALID')
    expect(s.hasConsumed('demo-grant-01')).toBe(false)
  })
  it('enforces replay rejection after one allowance', async () => {
    const s = new FixtureAuthoritySession()
    const first=await verifyFixtureAuthority({...SIGNED_FIXTURE},sampleAuthorityRequest(AUTHORITY_DEMO_CLOCK),s)
    const second=await verifyFixtureAuthority({...SIGNED_FIXTURE},sampleAuthorityRequest(AUTHORITY_DEMO_CLOCK),s)
    expect(first.decision).toBe('ALLOW_FIXTURE_ONLY')
    expect(second.reason).toBe('REPLAY')
    expect(second.executed).toBe(false)
  })
})
