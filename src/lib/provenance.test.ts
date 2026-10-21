import {describe,expect,it} from 'vitest'
import placeholder from '../../public/provenance-report.json'
import {isProvenanceReport,provenanceIsStale,type ProvenanceReport,type LockedPackage} from './provenance'

const entry:LockedPackage={
 path:'node_modules/react',name:'react',version:'19.1.1',license:'MIT',source:'npm-registry',integrity:'sha512',
 integrityValue:'sha512-QUJDRA==',development:false,optional:false,
}
const sample:ProvenanceReport={
 schema:'whitehatledger369.lock-inventory.v1',
 subject:'MichaelWave369/WhiteHatLedger369',
 generated_at:'2026-10-21T18:00:00.000Z',
 source:{manifest_sha256:'a'.repeat(64),lock_sha256:'b'.repeat(64),git_commit:'c'.repeat(40),
         environment_node:'v22',integrity:'UNSIGNED_CI_SOURCE_CLAIM'},
 scope:'npm lockfile entries, not installed artifacts',
 summary:{locked_entries:1,sha512_integrity:1,registry_resolved:1,development_entries:0,optional_entries:0,incomplete:0},
 entries:[entry],
 checks:{manifest_lock_consistency:'PASS',entries_registry_sha512:'PASS',
         installed_tree_attestation:'UNKNOWN',deployed_artifact_provenance:'UNKNOWN'},
 disclaimer:'Unsigned',
}
describe('R7 provenance reader',()=>{
 it('accepts not-generated placeholder only as unknown',()=>{
   expect(isProvenanceReport(placeholder)).toBe(true)
   expect(provenanceIsStale(placeholder as ProvenanceReport)).toBe(true)
 })
 it('validates consistent generated lock reports',()=>{
   expect(isProvenanceReport(sample)).toBe(true)
 })
 it('refuses to promote deployed artifacts to PASS',()=>{
   expect(isProvenanceReport({...sample,checks:{...sample.checks,deployed_artifact_provenance:'PASS'}})).toBe(false)
 })
 it('catches package count, integrity and source misstatements',()=>{
   expect(isProvenanceReport({...sample,summary:{...sample.summary,locked_entries:2}})).toBe(false)
   expect(isProvenanceReport({...sample,summary:{...sample.summary,incomplete:1}})).toBe(false)
   expect(isProvenanceReport({...sample,entries:[{...entry,integrity:'missing-or-other'}]})).toBe(false)
 })
 it('flags reports older than 48h',()=>{
   expect(provenanceIsStale(sample,Date.parse('2026-10-22T17:00:00Z'))).toBe(false)
   expect(provenanceIsStale(sample,Date.parse('2026-10-24T18:00:00Z'))).toBe(true)
 })
})
