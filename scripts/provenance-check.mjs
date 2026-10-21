#!/usr/bin/env node
import {readFileSync} from 'node:fs'
import {parseLockInventory} from './provenance-core.mjs'
try{
 const manifest=readFileSync('package.json','utf8'),lock=readFileSync('package-lock.json','utf8')
 const result=parseLockInventory(manifest,lock)
 if(result.summary.locked_entries===0||result.summary.incomplete>0)throw new Error('R7 lockfile has missing SHA-512 integrity or unexpected registry sources')
 console.log(`LOCKFILE CONSISTENT. ${result.summary.locked_entries} frozen entries, manifest hash ${result.source.manifest_sha256}, lock hash ${result.source.lock_sha256}.`)
 console.log('This check does not attest a deployed artifact or validate that packages are vulnerability-free.')
}catch(e){console.error('LOCKFILE UNKNOWN/FAIL:',e instanceof Error?e.message:'unknown');process.exitCode=1}
