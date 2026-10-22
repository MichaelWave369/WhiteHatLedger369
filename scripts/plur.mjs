#!/usr/bin/env node
import {mkdirSync,writeFileSync} from 'node:fs'
import {resolve,join} from 'node:path'
import {checkProject} from './plur-core.mjs'

const mode=process.argv[2] ?? 'check'
if (!['check','report'].includes(mode)) {
 console.error('Usage: node scripts/plur.mjs check|report [directory]')
 process.exit(2)
}
const root=resolve(process.argv[3]??'.')
const result=checkProject(root,{sourceCommitClaim:process.env.GITHUB_SHA??null})
if (mode==='report') {
 mkdirSync(join(root,'public'),{recursive:true})
 writeFileSync(join(root,'public/plur-report.json'),JSON.stringify(result,null,2)+'\n')
}
console.log('PLUR '+result.status+': '+result.scanned_files+' source files, '+result.findings.length+' findings, '+result.problems.length+' coverage errors.')
for (const finding of result.findings) console.log(finding.severity+' '+finding.rule_id+' '+finding.path+':'+finding.line)
for (const problem of result.problems) console.log('UNKNOWN '+problem.reason+' '+problem.path)
console.log('Receipt SHA-256: '+result.receipt_sha256+' (UNSIGNED, NOT SECURITY CERTIFICATION)')
if (mode==='check' && result.status!=='PASS') process.exitCode=1
