import {describe,expect,it} from 'vitest'
import {
 ARTIFACT_DOMAIN,isArtifactManifest,isSafeWitnessPath,checksumWitnessFiles,
 verifyManifestRoot,type ArtifactManifest,
} from './artifact'

const files=[
 {path:'assets/a.js',bytes:3,sha256:'a'.repeat(64)},
 {path:'index.html',bytes:5,sha256:'b'.repeat(64)},
]
function create(root:string):ArtifactManifest{
 return {
  schema:'whitehatledger369.artifact-witness.v1',
  subject:'MichaelWave369/WhiteHatLedger369',
  generated_at:'2026-10-21T12:00:00.000Z',
  mode:'SELF_REPORTED_BUILD_DIGESTS',
  source:{manifest_sha256:'a'.repeat(64),lock_sha256:'b'.repeat(64),git_commit:null,integrity:'UNSIGNED_BUILDER_CLAIM'},
  file_count:2,total_bytes:8,root_sha256:root,files,disclaimer:'Not an attestation',
 }
}
describe('R8 hosted artifact manifest reader',()=>{
 it('matches Node canonical fingerprint of frozen sorted file list',async()=>{
   const root=await checksumWitnessFiles(files)
   expect(root).toMatch(/^[a-f0-9]{64}$/)
   expect(ARTIFACT_DOMAIN).toContain('WHL369-R8-BUILD-FILES-V1')
   expect(await verifyManifestRoot(create(root))).toBe(true)
 })
 it('rejects changed hashes relative to checkpoint',async()=>{
   const root=await checksumWitnessFiles(files)
   const tampered=create(root)
   tampered.files=[{...files[0],sha256:'c'.repeat(64)},files[1]]
   expect(await verifyManifestRoot(tampered)).toBe(false)
 })
 it('rejects inserted out-of-order or traversal paths',()=>{
   for(const p of ['../etc/passwd','a/../b','/root','artifact-manifest.json','a//b','a\\b'])
     expect(isSafeWitnessPath(p)).toBe(false)
   expect(isSafeWitnessPath('assets/index-JSDIGEST.js')).toBe(true)
 })
 it('rejects overclaiming deployed identity via supplied input',async()=>{
   const root=await checksumWitnessFiles(files)
   expect(isArtifactManifest({...create(root),mode:'PRODUCTION_ATTESTATION'})).toBe(false)
   expect(isArtifactManifest({...create(root),source:{...create(root).source,integrity:'SIGNED_BY_BUILDER'}})).toBe(false)
 })
 it('rejects tampered totals, duplicates, and fabricated file list sizes',async()=>{
   const root=await checksumWitnessFiles(files)
   expect(isArtifactManifest({...create(root),total_bytes:9})).toBe(false)
   expect(isArtifactManifest({...create(root),file_count:3})).toBe(false)
   expect(isArtifactManifest({...create(root),files:[files[0],files[0]]})).toBe(false)
 })
})
