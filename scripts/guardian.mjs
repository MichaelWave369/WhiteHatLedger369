#!/usr/bin/env node
/**
 * R6 local policy evaluator. Fixed files in this repository only;
 * read-only assessment, unsigned JSON report, never blocks the deployment.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { verifyEvidenceOnNode } from './evidence-verifier-core.mjs'
import { evaluateGuardian } from './guardian-core.mjs'

const LOCAL_SENTINEL=resolve('public/sentinel-report.json')
const LOCAL_EVIDENCE=resolve('public/evidence-ledger.json')
const MANIFEST=resolve('package.json')
const OUTPUT=resolve('public/guardian-report.json')

async function safeJSON(path){
  try {
    const raw=await readFile(path,'utf8')
    if(raw.length>65536)return null
    return JSON.parse(raw)
  } catch { return null }
}
async function main(){
  const manifest=await readFile(MANIFEST,'utf8')
  const sha=createHash('sha256').update(manifest,'utf8').digest('hex')
  const sentinel=await safeJSON(LOCAL_SENTINEL)
  const evidence=await safeJSON(LOCAL_EVIDENCE)
  let verified=null
  try { verified=evidence?verifyEvidenceOnNode(evidence):null } catch { /* becomes failed fixture */ }
  const report=evaluateGuardian({
    sentinel,
    manifestSha256:sha,
    evidenceVerification:verified,
    commit:process.env.GITHUB_SHA ?? null,
  })
  await mkdir(dirname(OUTPUT),{recursive:true})
  await writeFile(OUTPUT,JSON.stringify(report,null,2)+'\n',{mode:0o644})
  console.log(`Guardian: advisory=${report.production_release.status}; mode=${report.mode}; deployment_blocking=${report.deployment_blocking}`)
  report.controls.forEach(c=>console.log(`  ${c.status.padEnd(7)} ${c.id}: ${c.detail}`))
  console.log(`  ${report.demonstration.status.padEnd(7)} synthetic R5 fixture (EXCLUDED from production release)`)
  // Explicitly does not pretend policy UNKNOWN is a fatal CI error.
  // Only operational failures, such as invalid local manifest, throw.
}
main().catch(err=>{
  console.error('Guardian failed to generate its advisory: '+(err instanceof Error?err.message:'unknown failure'))
  process.exitCode=1
})
