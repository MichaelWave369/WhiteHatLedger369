import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { evaluateGuardian,evaluateAdvisory,combineStatuses,GUARDIAN_POLICY } from './guardian-core.mjs'
import { verifyEvidenceOnNode } from './evidence-verifier-core.mjs'
const manifest=readFileSync(new URL('../package.json',import.meta.url),'utf8')
const sha=createHash('sha256').update(manifest).digest('hex')
const evidence=JSON.parse(readFileSync(new URL('../public/evidence-ledger.json',import.meta.url),'utf8'))
const time=new Date('2026-10-21T12:30:00.000Z')
const base=()=>({
  schema:'whitehatledger369.sentinel.v1',subject:'MichaelWave369/WhiteHatLedger369',
  source:{path:'package.json',sha256:sha},
  generated_at:time.toISOString(),
  provider:{name:'OSV.dev',status:'complete'},
  summary:{direct_declared:1,exact_versions_queried:1,matched:0,none_reported:1,unknown:0},
  packages:[{name:'synthetic-package',version:'1.2.3',status:'none_reported',advisories:[]}],
})
const evaluate=(sentinel=base(),verified=verifyEvidenceOnNode(evidence))=>
  evaluateGuardian({sentinel,manifestSha256:sha,evidenceVerification:verified,now:time,commit:'a'.repeat(40)})

test('deterministic aggregate FAIL > UNKNOWN > PASS and cannot default PASS',()=>{
  assert.equal(combineStatuses(['PASS','PASS']),'PASS')
  assert.equal(combineStatuses(['PASS','UNKNOWN']),'UNKNOWN')
  assert.equal(combineStatuses(['UNKNOWN','FAIL']),'FAIL')
  assert.equal(combineStatuses([]),'UNKNOWN')
  assert.equal(combineStatuses(['PASS','MAYBE']),'UNKNOWN')
})
test('honest completeness only grants narrow PASS to fresh exact-version direct packages',()=>{
  assert.equal(evaluateAdvisory(base(),sha,time.getTime()).status,'PASS')
  const report=evaluate()
  assert.equal(report.policy,GUARDIAN_POLICY)
  assert.equal(report.demonstration.status,'PASS')
  assert.equal(report.controls[0].status,'PASS')
  assert.equal(report.production_release.status,'UNKNOWN')
  assert.equal(report.deployment_blocking,false)
  assert.equal(report.mode,'ADVISORY_ONLY')
})
test('a real OSV match makes operator-review FAIL, never a synthetic clearance',()=>{
  const data=base()
  data.summary.matched=1;data.summary.none_reported=0
  data.packages[0].status='matched';data.packages[0].advisories=[{id:'GHSA-abcd-1234-wxyz'}]
  assert.equal(evaluate(data).production_release.status,'FAIL')
  assert.equal(evaluate(data).deployment_blocking,false)
})
test('stale, unverified, and mismatched report sources are UNKNOWN',()=>{
  const data=base()
  data.generated_at='2026-10-01T00:00:00.000Z'
  assert.equal(evaluate(data).controls[0].status,'UNKNOWN')
  data.generated_at=time.toISOString()
  data.source.sha256='b'.repeat(64)
  assert.equal(evaluate(data).controls[0].status,'UNKNOWN')
  data.source.sha256=sha
  data.provider.status='unknown'
  assert.equal(evaluate(data).controls[0].status,'UNKNOWN')
  assert.equal(evaluate(null).controls[0].status,'UNKNOWN')
})
test('unpinned or unknown dependencies are never silently passed',()=>{
  const data=base()
  data.summary.unknown=1;data.summary.none_reported=0;data.summary.exact_versions_queried=0
  data.packages[0].status='unknown';data.packages[0].version=null
  assert.equal(evaluate(data).controls[0].status,'UNKNOWN')
  data.summary.unknown=0;data.summary.none_reported=1;data.summary.exact_versions_queried=1
  assert.equal(evaluate(data).controls[0].status,'UNKNOWN')
})
test('invalid signatures fail the demo control but never masquerade as production approval',()=>{
  const fake={ok:false,signatureValid:false,chainValid:false,recordsChecked:0}
  const report=evaluate(base(),fake)
  assert.equal(report.demonstration.status,'FAIL')
  assert.equal(report.production_release.status,'UNKNOWN')
  assert.match(report.demonstration.detail,/failed/)
})
test('report cannot manufacture a consent, runtime attestation, or patch retest PASS',()=>{
  const report=evaluate()
  for(const key of ['transitive_sbom','deployment_attestation','authorized_scope','patch_retest']){
    assert.equal(report.controls.find(x=>x.id===key).status,'UNKNOWN')
  }
  assert.equal(report.source.integrity,'UNATTESTED_CI_ENVIRONMENT_CLAIM')
})
