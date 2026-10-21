import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(fileURLToPath(new URL('./minotaur-container.mjs', import.meta.url)), 'utf8')

test('script is opt-in and never downloads images automatically', () => {
  assert.match(source, /MINOTAUR_CONFIRM !== 'synthetic-only'/)
  assert.match(source, /--pull=never/)
})
test('script requires explicit network disablement and privilege restrictions', () => {
  for (const restriction of ['--network=none', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges', '--pids-limit=32', '--memory=128m', '--cpus=0.5', '--user=65534:65534', 'readonly']) {
    assert.ok(source.includes(restriction), `Required argument missing: ${restriction}`)
  }
})
test('fixed fixture only, no custom images, shell interpolation or Docker socket', () => {
  assert.match(source, /const FIXED_IMAGE = 'node:22-alpine'/)
  assert.match(source, /'fixture.mjs'/)
  assert.doesNotMatch(source, /docker\.sock/)
  assert.doesNotMatch(source, /shell:\s*true/)
})
