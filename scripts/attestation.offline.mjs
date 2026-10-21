import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const pages=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8')
const ci=readFileSync(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8')

test('main-only deployment workflow holds attestation issuer privileges',()=>{
  assert.match(pages,/push:\s*\n\s*branches: \[main\]/)
  assert.match(pages,/jobs:\s*\n\s*build:\s*\n\s*runs-on: ubuntu-latest\s*\n\s*permissions:\s*\n\s*contents: read\s*\n\s*id-token: write\s*\n\s*attestations: write/)
  assert.doesNotMatch(pages,/pull_request:/)
  assert.match(ci,/permissions:\s*\n\s*contents: read/)
  assert.doesNotMatch(ci,/id-token: write/)
  assert.doesNotMatch(ci,/attestations: write/)
})
test('attest the finished immutable manifest only, after byte verification and before publication',()=>{
  const verify=pages.indexOf('npm run artifact:verify')
  const attest=pages.indexOf('uses: actions/attest@v4')
  const subject=pages.indexOf('subject-path: dist/artifact-manifest.json')
  const upload=pages.indexOf('uses: actions/upload-pages-artifact@v3')
  assert.ok(verify>=0&&attest>verify&&subject>attest&&upload>subject)
  assert.equal((pages.match(/uses: actions\/attest@v4/g)||[]).length,1)
  assert.doesNotMatch(pages,/subject-path: (?:dist\/\*|dist\/\*\*)/)
})
test('independent CLI verification fails closed before Pages artifact upload',()=>{
  const attest=pages.indexOf('uses: actions/attest@v4')
  const cli=pages.indexOf('gh attestation verify dist/artifact-manifest.json')
  const fail=pages.indexOf('exit 1',cli)
  const upload=pages.indexOf('uses: actions/upload-pages-artifact@v3')
  assert.ok(cli>attest&&fail>cli&&upload>fail)
  assert.match(pages,/--signer-workflow "\$GITHUB_REPOSITORY\/\.github\/workflows\/pages.yml"/)
  assert.match(pages,/--source-ref refs\/heads\/main/)
  assert.doesNotMatch(pages,/continue-on-error: true/)
})
test('attestation failure is not bypassed and deploy remains in separate least-privilege job',()=>{
  assert.match(pages,/deploy:\s*\n\s*needs: build/)
  assert.match(pages,/pages: write\s*\n\s*id-token: write/)
  assert.match(pages,/R9 attestation verification FAILED/)
  assert.doesNotMatch(ci,/uses: actions\/attest@/)
})
