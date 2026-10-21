#!/usr/bin/env node
/**
 * Independently check checked-in R5 synthetic signed fixture.
 * A public key compiled into this verifier is the trust anchor.
 * No private key, network target, or user-provided external URL is accepted.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { verifyEvidenceOnNode } from './evidence-verifier-core.mjs'

const reportPath=resolve('public/evidence-ledger.json')
try {
  const raw=readFileSync(reportPath,'utf8')
  if(raw.length > 65536)throw new Error('Size limit')
  const report=verifyEvidenceOnNode(JSON.parse(raw))
  console.log(JSON.stringify({schema:'whitehatledger369.r5-verification.v1',scope:'PINNED_SYNTHETIC_FIXTURE_ONLY',...report},null,2))
  if(!report.ok)process.exitCode=1
} catch(e) {
  console.error('R5 sample verifier failed closed: '+(e instanceof Error?e.message:'Unknown error'))
  process.exitCode=1
}
