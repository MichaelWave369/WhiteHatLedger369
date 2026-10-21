import { describe, expect, it } from 'vitest'
import baseline from '../../public/evidence-ledger.json'
import { EVIDENCE_DOMAIN, canonicalRecord, verifyEvidenceLedger, withEvidenceTamper, type EvidenceLedger } from './evidence'

const fixture=baseline as EvidenceLedger

describe('R5 signed evidence ledger: independent verification',()=>{
  it('cryptographically validates all three fixture records and pinned signed checkpoint',async()=>{
    const result=await verifyEvidenceLedger(fixture)
    expect(result).toMatchObject({status:'VERIFIED_SAMPLE',chainValid:true,signatureValid:true,claimsVerified:true})
    expect(result.inspected).toHaveLength(3)
    expect(result.inspected.every(r=>r.integrity==='MATCH')).toBe(true)
  })
  it('detects unauthorized summary modification',async()=>{
    const result=await verifyEvidenceLedger(withEvidenceTamper(fixture,'alter-summary'))
    expect(result).toMatchObject({status:'REJECTED',reason:'HASH_CHAIN_BROKEN',signatureValid:true})
    expect(result.inspected.some(r=>r.integrity==='BROKEN')).toBe(true)
  })
  it('detects removal and reordering',async()=>{
    for(const mode of ['remove-record','swap-records'] as const){
      const result=await verifyEvidenceLedger(withEvidenceTamper(fixture,mode))
      expect(result.status).toBe('REJECTED')
      expect(result.claimsVerified).toBe(false)
    }
  })
  it('cannot trust a self-modified signed checkpoint',async()=>{
    const result=await verifyEvidenceLedger(withEvidenceTamper(fixture,'forge-checkpoint'))
    expect(result).toMatchObject({status:'REJECTED',signatureValid:false})
  })
  it('rejects additional unknown fields, scopes and fabricated issuer',async()=>{
    expect((await verifyEvidenceLedger({...fixture, extra:'hidden'})).status).toBe('REJECTED')
    expect((await verifyEvidenceLedger({...fixture, checkpoint:{...fixture.checkpoint,issuer:'random'}})).status).toBe('REJECTED')
    const copy=withEvidenceTamper(fixture,'clean')
    copy.records[0].subject='https://github.com/someone'
    expect((await verifyEvidenceLedger(copy)).status).toBe('REJECTED')
  })
  it('canonicalizes only the declared payload fields',()=>{
    const text=EVIDENCE_DOMAIN+canonicalRecord(fixture.records[0])
    expect(text).toContain('SIMULATED')
    expect(text).not.toContain(fixture.records[0].hash)
  })
})
