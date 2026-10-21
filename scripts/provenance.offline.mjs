import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {buildProvenanceReport,parseLockInventory,isReportInternallyConsistent} from './provenance-core.mjs'

const manifest=readFileSync(new URL('../package.json',import.meta.url),'utf8')
const lock=readFileSync(new URL('../package-lock.json',import.meta.url),'utf8')
const actual=JSON.parse(lock)
const clone=()=>JSON.parse(JSON.stringify(actual))

test('R7 committed v3 lockfile binds root manifest and contains registry SHA512 entries',()=>{
 const data=parseLockInventory(manifest,lock)
 assert.ok(data.summary.locked_entries>50)
 assert.equal(data.summary.incomplete,0)
 assert.equal(data.summary.sha512_integrity,data.summary.locked_entries)
 assert.equal(data.summary.registry_resolved,data.summary.locked_entries)
 assert.match(data.source.lock_sha256,/^[a-f0-9]{64}$/)
})
test('R7 never infers a deployed artifact from a lockfile',()=>{
 const report=buildProvenanceReport(manifest,lock,{now:()=>new Date('2026-10-21T12:00:00Z')})
 assert.equal(report.checks.manifest_lock_consistency,'PASS')
 assert.equal(report.checks.entries_registry_sha512,'PASS')
 assert.equal(report.checks.deployed_artifact_provenance,'UNKNOWN')
 assert.equal(report.checks.installed_tree_attestation,'UNKNOWN')
 assert.equal(isReportInternallyConsistent(report),true)
})
test('changed manifest and stale lockfile root fail closed',()=>{
 const m=JSON.parse(manifest);m.dependencies.react='999.0.0'
 assert.throws(()=>parseLockInventory(JSON.stringify(m),lock),/MISMATCH/)
 const data=clone();data.packages[''].version='0.0.0'
 assert.throws(()=>parseLockInventory(manifest,JSON.stringify(data)),/ROOT_MISMATCH/)
})
test('truncated or missing integrity is unknown, never silently complete',()=>{
 const data=clone(),key=Object.keys(data.packages).find(k=>k!=='')
 delete data.packages[key].integrity
 const result=buildProvenanceReport(manifest,JSON.stringify(data))
 assert.equal(result.summary.incomplete,1)
 assert.equal(result.checks.entries_registry_sha512,'UNKNOWN')
})
test('unknown source URLs are not treated as trusted registry metadata',()=>{
 const data=clone(),key=Object.keys(data.packages).find(k=>k!=='')
 data.packages[key].resolved='https://example.invalid/fake.tgz'
 const result=buildProvenanceReport(manifest,JSON.stringify(data))
 assert.equal(result.summary.incomplete,1)
 assert.equal(result.entries.find(e=>e.path===key).source,'other-or-unverified')
})
test('root dependency declaration must match lockfile exactly',()=>{
 const data=clone();data.packages[''].dependencies.react='19.99.99'
 assert.throws(()=>parseLockInventory(manifest,JSON.stringify(data)),/MISMATCH/)
})
