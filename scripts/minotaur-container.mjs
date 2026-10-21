#!/usr/bin/env node
/**
 * Optional, local Docker smoke test. Never invoked on CI or by the browser.
 * Only runs the bundled inert local fixture, no arbitrary code/input.
 *
 * Docker daemon access is highly privileged: do NOT give untrusted agents
 * access to Docker or mount the daemon socket into any workload.
 */
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const FIXED_IMAGE = 'node:22-alpine'
const fixedFixture = resolve(dirname(fileURLToPath(import.meta.url)), '../lab/minotaur')

function fail(message) {
  console.error('MINOTAUR LOCAL CONTAINER: ' + message)
  process.exitCode = 1
}

if (process.env.MINOTAUR_CONFIRM !== 'synthetic-only') {
  fail('Explicit opt-in required: set MINOTAUR_CONFIRM=synthetic-only')
} else if (!existsSync(join(fixedFixture, 'fixture.mjs'))) {
  fail('Bundled synthetic fixture missing.')
} else {
  const inspect = spawnSync('docker', ['image', 'inspect', FIXED_IMAGE], {
    encoding: 'utf8', timeout: 15_000, windowsHide: true,
  })
  if (inspect.error || inspect.status !== 0) {
    fail('Docker unavailable or local image absent. Manually inspect and pull node:22-alpine, then retry. This script never pulls images.')
  } else {
    const args = [
      'run', '--rm', '--pull=never',
      '--network=none',
      '--read-only',
      '--cap-drop=ALL',
      '--security-opt=no-new-privileges',
      '--pids-limit=32',
      '--memory=128m',
      '--cpus=0.5',
      '--user=65534:65534',
      '--tmpfs', '/tmp:rw,nosuid,nodev,noexec,size=16m',
      '--mount', `type=bind,source=${fixedFixture},target=/lab,readonly`,
      '--workdir=/lab',
      '--entrypoint=node',
      FIXED_IMAGE, 'fixture.mjs',
    ]
    const run = spawnSync('docker', args, {
      encoding: 'utf8', stdio: 'inherit', timeout: 30_000, windowsHide: true,
    })
    if (run.error) {
      fail('Docker execution unavailable or timed out. No pass is claimed.')
    } else if (run.status !== 0) {
      fail('Fixture isolation checks failed. Do not trust the container configuration.')
    }
  }
}
