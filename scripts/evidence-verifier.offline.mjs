import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { verifyEvidenceOnNode } from './evidence-verifier-core.mjs'

const fixture=JSON.parse(readFileSync(new URL('../public/evidence-ledger.json',import.meta.url),'utf8'))
const clone=()=>JSON.parse(JSON.stringify(fixture))

test('independent Node verifier confirms signed sample and chain',()=>{
  assert.deepEqual(verifyEvidenceOnNode(fixture),{
    ok:true,reason:'TRUSTED_SAMPLE_CHAIN_AND_SIGNED_HEAD',signatureValid:true,chainValid:true,recordsChecked:3,
  })
})
test('tampering with receipt contents breaks hash chain',()=>{
  const data=clone()
  data.records[1].summary+=' unauthorized'
  assert.equal(verifyEvidenceOnNode(data).ok,false)
})
test('truncation, reordering and duplicated sequence fail',()=>{
  const removed=clone();removed.records.pop()
  assert.equal(verifyEvidenceOnNode(removed).ok,false)
  const reordered=clone();[reordered.records[0],reordered.records[1]]=[reordered.records[1],reordered.records[0]]
  assert.equal(verifyEvidenceOnNode(reordered).ok,false)
  const duplicate=clone();duplicate.records[1].sequence=1
  assert.equal(verifyEvidenceOnNode(duplicate).ok,false)
})
test('self-signed or changed checkpoint is not trusted',()=>{
  const cp=clone();cp.checkpoint.head='0'.repeat(64)
  assert.equal(verifyEvidenceOnNode(cp).ok,false)
  const spoofed=clone();spoofed.checkpoint.issuer='attacker'
  assert.equal(verifyEvidenceOnNode(spoofed).ok,false)
  const sig=clone();sig.signature=sig.signature.slice(0,-2)+'AA'
  assert.equal(verifyEvidenceOnNode(sig).ok,false)
})
test('real repository paths and extra fields fail scope validation',()=>{
  const external=clone();external.records[0].subject='https://github.com/example'
  assert.equal(verifyEvidenceOnNode(external).ok,false)
  const extended=clone();extended.secret='not allowed'
  assert.equal(verifyEvidenceOnNode(extended).ok,false)
})
