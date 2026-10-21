import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {hashBytes,fingerprint} from './artifact-core.mjs'
import {
 PUBLISHED_BASE,REPOSITORY,SIGNER_WORKFLOW,inspectServedManifest,
 compareHostedAssets,custodySummary,digestHex,
} from './custody-core.mjs'

const commit='a'.repeat(40)
const files={
 'assets/app.js':Buffer.from('console.log("safe fixture")'),
 'index.html':Buffer.from('<html>fixture</html>'),
}
const entries=Object.entries(files).sort(([a],[b])=>a.localeCompare(b))
 .map(([path,body])=>({path,bytes:body.length,sha256:hashBytes(body)}))
const manifest={
 schema:'whitehatledger369.artifact-witness.v1',
 subject:REPOSITORY,
 generated_at:'2026-10-21T12:00:00.000Z',
 mode:'SELF_REPORTED_BUILD_DIGESTS',
 source:{manifest_sha256:'a'.repeat(64),lock_sha256:'b'.repeat(64),
  git_commit:commit,integrity:'UNSIGNED_BUILDER_CLAIM'},
 file_count:entries.length,total_bytes:entries.reduce((sum,x)=>sum+x.bytes,0),
 root_sha256:fingerprint(entries),files:entries,
 disclaimer:'synthetic local test only',
}
const bytes=Buffer.from(JSON.stringify(manifest))
const hash=digestHex(bytes)
const serve=async uri=>{
 const pathname=new URL(uri).pathname.replace('/WhiteHatLedger369/','')
 if(!(pathname in files))throw new Error('404')
 return files[pathname]
}

test('real exact post-deploy digest must be pinned to expected build and Git SHA',()=>{
 assert.equal(inspectServedManifest(bytes,hash,commit).root_sha256,manifest.root_sha256)
 assert.throws(()=>inspectServedManifest(bytes,'0'.repeat(64),commit),/DIFFERS/)
 assert.throws(()=>inspectServedManifest(bytes,hash,'b'.repeat(40)),/SOURCE_COMMIT_MISMATCH/)
 assert.throws(()=>inspectServedManifest(bytes,'',commit),/NOT_PINNED/)
})
test('all hosted files must match, not merely signed manifest integrity',async()=>{
 const outcome=await compareHostedAssets(manifest,serve)
 assert.equal(outcome.status,'MATCH')
 assert.equal(outcome.checked,2)
 assert.equal(outcome.total,2)
 const evidence=custodySummary({manifest,manifestSha256:hash,files:outcome,
   signatureVerified:true,expectedCommit:commit})
 assert.equal(evidence.conclusion,'BYTE_CUSTODY_MATCH')
 assert.equal(evidence.attestation.signer_workflow,SIGNER_WORKFLOW)
 assert.equal(evidence.attestation.source_digest,commit)
})
test('changed file of same length fails custody',async()=>{
 const actual=await compareHostedAssets(manifest,async uri=>{
  if(uri===PUBLISHED_BASE+'assets/app.js')return Buffer.from('X'+files['assets/app.js'].subarray(1).toString())
  return serve(uri)
 })
 assert.equal(actual.status,'FAIL')
 assert.equal(actual.mismatches[0].reason,'FILE_CONTENT_OR_LENGTH_MISMATCH')
})
test('unavailable hosted assets never count as a successful match',async()=>{
 const result=await compareHostedAssets(manifest,async uri=>{
  if(uri.endsWith('index.html'))throw new Error('404')
  return serve(uri)
 })
 assert.equal(result.status,'FAIL')
 assert.equal(result.checked,1)
 const receipt=custodySummary({manifest,manifestSha256:hash,files:result,
  signatureVerified:true,expectedCommit:commit})
 assert.equal(receipt.conclusion,'NOT_VERIFIED')
})
test('even matching bytes cannot count as verified without cryptographic signer evidence',async()=>{
 const filesResult=await compareHostedAssets(manifest,serve)
 const claim=custodySummary({manifest,manifestSha256:hash,files:filesResult,
  signatureVerified:false,expectedCommit:commit})
 assert.equal(claim.conclusion,'NOT_VERIFIED')
 assert.equal(claim.attestation.status,'UNKNOWN')
})
test('tampered manifest schema and root fail before touching any remote assets',async()=>{
 assert.throws(()=>inspectServedManifest(Buffer.from('{}'),digestHex(Buffer.from('{}')),commit),/INVALID_PUBLISHED/)
 const wrong={...manifest,root_sha256:'c'.repeat(64)}
 await assert.rejects(()=>compareHostedAssets(wrong,serve),/INVALID_MANIFEST/)
})
test('configuration confines network reconciliation to first-party domain',()=>{
 assert.equal(PUBLISHED_BASE,'https://michaelwave369.github.io/WhiteHatLedger369/')
 assert.equal(SIGNER_WORKFLOW,'MichaelWave369/WhiteHatLedger369/.github/workflows/pages.yml')
 const script=readFileSync(new URL('./custody-verify.mjs',import.meta.url),'utf8')
 assert.match(script,/--source-digest/)
 assert.match(script,/--deny-self-hosted-runners/)
 assert.match(script,/spawnSync\('gh',args/)
 assert.match(script,/shell:false/)
 assert.match(script,/REMOTE_TARGET_OUT_OF_SCOPE/)
 assert.doesNotMatch(script,/continue-on-error/)
})

test('deployment custody runs after successful deploy and inherits no signing privileges',()=>{
 const yaml=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8')
 const custody=yaml.split('\n  custody:\n')[1]
 assert.ok(custody)
 assert.match(custody,/needs: \[build, deploy\]/)
 assert.match(custody,/permissions:\s*\n\s*contents: read\s*\n\s*attestations: read/)
 assert.doesNotMatch(custody,/id-token: write/)
 assert.doesNotMatch(custody,/attestations: write/)
 assert.match(custody,/EXPECTED_MANIFEST_SHA256: \$\{\{ needs\.build\.outputs\.manifest_sha256 \}\}/)
 assert.match(custody,/node scripts\/custody-verify\.mjs/)
 assert.match(custody,/if: always\(\)/)
})
