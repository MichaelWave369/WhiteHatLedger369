/**
 * Container smoke test for a FIXED, owned harmless local fixture.
 * Does not load arbitrary code or connect to any network address.
 *
 * This test is supplementary evidence, NOT proof that Docker can safely
 * host hostile multi-tenant workloads or that Docker's daemon is untrusted.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

function mountIsReadOnly(target) {
  const lines = readFileSync('/proc/self/mountinfo', 'utf8').split('\n')
  return lines.some((line) => {
    const fields = line.split(' ')
    return fields[4] === target && fields[5]?.split(',').includes('ro')
  })
}
function statusField(field) {
  const status = readFileSync('/proc/self/status', 'utf8')
  return status.match(new RegExp('^' + field + ':\\s*(\\S+)', 'm'))?.[1] ?? null
}
function deniedWrite(target) {
  try {
    writeFileSync(target, 'fixture-write-test', { flag: 'wx' })
    // Remove-on-success is intentionally omitted: a successful write must
    // flag a failed isolation check, and test runs in an ephemeral container.
    return false
  } catch (error) {
    if (error?.code === 'EACCES' || error?.code === 'EPERM' || error?.code === 'EROFS') return true
    throw error
  }
}

const interfaces = readdirSync('/sys/class/net').sort()
const checks = {
  unprivileged_user: process.getuid?.() === 65534,
  no_effective_caps: /^0+$/.test(statusField('CapEff') ?? ''),
  no_new_privileges: statusField('NoNewPrivs') === '1',
  root_read_only: mountIsReadOnly('/'),
  fixture_bind_read_only: mountIsReadOnly('/lab'),
  write_to_root_denied: deniedWrite('/__minotaur_fixture_probe'),
  write_to_fixture_denied: deniedWrite('/lab/__minotaur_fixture_probe'),
  loopback_only: interfaces.length === 1 && interfaces[0] === 'lo',
}

const passed = Object.values(checks).every(Boolean)
process.stdout.write(JSON.stringify({
  schema: 'whitehatledger369.minotaur.container-smoke.v1',
  subject: 'fixed-synthetic-fixture-only',
  checks,
  passed,
  disclaimer: 'Unsigned local Docker configuration observation; no hostile workloads were run.',
}, null, 2) + '\n')
process.exitCode = passed ? 0 : 1
