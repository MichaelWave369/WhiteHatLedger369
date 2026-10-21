import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSentinelReport, extractDirectDependencies, queryOsvAdvisories, OSV_ENDPOINT } from './sentinel-core.mjs'

const manifest = JSON.stringify({
  dependencies: { alpha: '1.2.3', beta: '^2.0.0' },
  devDependencies: { gamma: '3.0.0' },
})
const fixedNow = () => new Date('2026-10-21T00:00:00.000Z')

test('only exact declared versions are considered queryable', () => {
  assert.deepEqual(extractDirectDependencies(manifest).map(d => [d.name, d.version]), [
    ['alpha', '1.2.3'],
    ['beta', null],
    ['gamma', '3.0.0'],
  ])
})

test('OSV response matches package order and records advisory IDs', async () => {
  let called = 0
  const fake = async (url, request) => {
    called++
    assert.equal(url, OSV_ENDPOINT)
    assert.equal(request.method, 'POST')
    const q = JSON.parse(request.body).queries
    assert.deepEqual(q.map(p => p.package.name), ['alpha', 'gamma'])
    return { ok: true, json: async () => ({ results: [{ vulns: [{ id: 'GHSA-abcd-1234-efgh' }] }, {}] }) }
  }
  const report = await buildSentinelReport(manifest, { now: fixedNow, commit: 'a'.repeat(40), fetcher: fake })
  assert.equal(called, 1)
  assert.equal(report.provider.status, 'complete')
  assert.deepEqual(report.summary, { direct_declared: 3, exact_versions_queried: 2, matched: 1, none_reported: 1, unknown: 1 })
  assert.equal(report.packages[0].advisories[0].id, 'GHSA-abcd-1234-efgh')
  assert.equal(report.packages[1].status, 'unknown')
  assert.match(report.source.sha256, /^[a-f0-9]{64}$/)
  assert.equal(report.source.git_commit, 'a'.repeat(40))
})

test('unreachable provider fails closed, with no falsely clean packages', async () => {
  const report = await buildSentinelReport(manifest, {
    now: fixedNow,
    fetcher: async () => { throw new Error('offline') },
  })
  assert.equal(report.provider.status, 'unknown')
  assert.equal(report.summary.none_reported, 0)
  assert.equal(report.summary.unknown, 3)
})

test('missing OSV results fails closed', async () => {
  const report = await buildSentinelReport(manifest, {
    now: fixedNow,
    fetcher: async () => ({ ok: true, json: async () => ({ results: [{}] }) }),
  })
  assert.equal(report.provider.status, 'unknown')
  assert.equal(report.summary.matched, 0)
  assert.equal(report.summary.unknown, 3)
})

test('OSV paged batches must be complete, not silently truncated', async () => {
  let pageCount = 0
  const output = await queryOsvAdvisories(
    [{ name: 'alpha', version: '1.0.0' }],
    async (_url, request) => {
      pageCount++
      const q = JSON.parse(request.body).queries[0]
      if (pageCount === 1) {
        assert.equal(q.page_token, undefined)
        return { ok: true, json: async () => ({ results: [{ vulns: [{ id: 'OSV-123' }], next_page_token: 'next' }] }) }
      }
      assert.equal(q.page_token, 'next')
      return { ok: true, json: async () => ({ results: [{ vulns: [{ id: 'OSV-456' }] }] }) }
    },
  )
  assert.deepEqual(output, [[{ id: 'OSV-123' }, { id: 'OSV-456' }]])
})

test('pagination that never ends cannot certify a complete check', async () => {
  const report = await buildSentinelReport(JSON.stringify({ dependencies: { alpha: '1.0.0' } }), {
    fetcher: async () => ({ ok: true, json: async () => ({ results: [{ next_page_token: 'still-going' }] }) }),
  })
  assert.equal(report.provider.status, 'unknown')
  assert.equal(report.summary.unknown, 1)
})

test('no exact dependency means no OSV call and an honest unknown result', async () => {
  const report = await buildSentinelReport(JSON.stringify({ dependencies: { alpha: '^1.0.0' } }), {
    fetcher: () => { throw new Error('Should not call OSV') },
  })
  assert.equal(report.provider.status, 'not_queried')
  assert.equal(report.summary.unknown, 1)
})

test('malformed package manifest fails rather than inventing a clean scan', async () => {
  await assert.rejects(buildSentinelReport('{ broken json'), SyntaxError)
  assert.throws(() => extractDirectDependencies('{"dependencies":[] }'))
})
