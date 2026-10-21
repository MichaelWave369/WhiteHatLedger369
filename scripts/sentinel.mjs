#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { buildSentinelReport } from './sentinel-core.mjs'

// Intentional: fixed local allowlisted manifest and report paths only.
// This CLI does not follow user-supplied URLs or access any other repositories.
const manifestPath = resolve('package.json')
const reportPath = resolve('public/sentinel-report.json')

async function main() {
  const manifest = await readFile(manifestPath, 'utf8')
  const report = await buildSentinelReport(manifest, { commit: process.env.GITHUB_SHA || null })
  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { mode: 0o644 })
  console.log(`Sentinel: provider=${report.provider.status}, exact queries=${report.summary.exact_versions_queried}, advisory matches=${report.summary.matched}, unknown=${report.summary.unknown}`)
  console.log('R1 scope: WhiteHatLedger369 direct declared npm dependencies ONLY. Not transitive, not a security certificate.')
  if (report.provider.status !== 'complete') {
    console.warn('Sentinel advisory status UNKNOWN or NOT QUERIED. Do not treat as a clean check.')
  }
}

main().catch((error) => {
  console.error('Sentinel configuration failed:', error instanceof Error ? error.message : 'Unknown error')
  process.exitCode = 1
})
