#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {resolve,dirname} from 'node:path'
import {buildProvenanceReport,isReportInternallyConsistent} from './provenance-core.mjs'

async function main(){
 const [manifest,lock]=await Promise.all([
   readFile(resolve('package.json'),'utf8'),readFile(resolve('package-lock.json'),'utf8')])
 const report=buildProvenanceReport(manifest,lock,{commit:process.env.GITHUB_SHA??null})
 if(!isReportInternallyConsistent(report))throw new Error('Generated inventory inconsistency')
 await mkdir(dirname(resolve('public/provenance-report.json')),{recursive:true})
 await writeFile(resolve('public/provenance-report.json'),JSON.stringify(report,null,2)+'\n')
 console.log(`R7 dependency lock observation: ${report.summary.locked_entries} lock entries, ${report.summary.sha512_integrity} SHA-512 integrity metadata, ${report.summary.incomplete} incomplete source records.`)
 console.log('This inventory is an UNSIGNED lockfile declaration, NOT independent deployed-artifact provenance.')
}
main().catch(e=>{console.error('R7 lock report failed closed:',e instanceof Error?e.message:'unknown');process.exitCode=1})
