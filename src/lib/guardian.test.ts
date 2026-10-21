import {describe,expect,it} from 'vitest'
import sample from '../../public/guardian-report.json'
import {aggregatePolicy,guardianIsStale,simulatePolicy,validateGuardian,type GuardianReport} from './guardian'

describe('R6 report and fail-closed UI',()=>{
 it('treats checked-in placeholder as unassessed, never certified',()=>{
   expect(validateGuardian(sample)).toBe(true)
   expect(guardianIsStale(sample as GuardianReport)).toBe(true)
   expect(sample.production_release.status).toBe('UNKNOWN')
 })
 it('enforces policy dominance',()=>{
   expect(aggregatePolicy(['PASS','PASS'])).toBe('PASS')
   expect(aggregatePolicy(['PASS','UNKNOWN'])).toBe('UNKNOWN')
   expect(aggregatePolicy(['FAIL','UNKNOWN'])).toBe('FAIL')
   expect(aggregatePolicy([])).toBe('UNKNOWN')
 })
 it('simulates honest PASS/UNKNOWN/FAIL outcomes only for toy controls',()=>{
   expect(simulatePolicy('all-pass').status).toBe('PASS')
   expect(simulatePolicy('unknown').status).toBe('UNKNOWN')
   expect(simulatePolicy('fail').status).toBe('FAIL')
   expect(simulatePolicy('all-pass').note).toMatch(/NOT a production/)
 })
 it('rejects attempts to claim release approval without all fixed checks',()=>{
   const f={...sample,generated_at:new Date().toISOString(),production_release:{status:'PASS',detail:'secure!'}}
   expect(validateGuardian(f)).toBe(false)
   expect(validateGuardian({...sample,deployment_blocking:true})).toBe(false)
   expect(validateGuardian({...sample,mode:'ENFORCING'})).toBe(false)
 })
 it('rejects fabricated PASS for currently unsupported real-world assurances',()=>{
   const controls=[
     {id:'direct_npm_advisories',label:'Direct advisory',status:'PASS',detail:'No reported matches',scope:'npm direct'},
     {id:'transitive_sbom',label:'Transitive',status:'PASS',detail:'Claim',scope:'production'},
     {id:'deployment_attestation',label:'Deploy',status:'UNKNOWN',detail:'No claim',scope:'production'},
     {id:'authorized_scope',label:'Consent',status:'UNKNOWN',detail:'No claim',scope:'production'},
     {id:'patch_retest',label:'Retest',status:'UNKNOWN',detail:'No claim',scope:'production'},
   ]
   const attempt={...sample,generated_at:new Date().toISOString(),controls,
     production_release:{status:'UNKNOWN',detail:'incomplete'}}
   expect(validateGuardian(attempt)).toBe(false)
 })
})
