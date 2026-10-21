#!/usr/bin/env node
/** Verify a downloaded R12 DRAFT. Never evaluates owner approval. */
import {readFile} from 'node:fs/promises'
import {validateRecoveryProposal} from './recovery-core.mjs'

async function main(){
 const path=process.argv[2]
 if(!path||process.argv.length!==3)throw Error('Usage: node scripts/recovery-verify.mjs path/to/draft.json')
 const bytes=await readFile(path)
 if(bytes.length>8192)throw Error('DRAFT_EXCEEDS_SIZE_LIMIT')
 const value=JSON.parse(bytes.toString('utf8'))
 const verdict=validateRecoveryProposal(value,{at:new Date()})
 console.log(JSON.stringify(verdict,null,2))
 if(verdict.status!=='DRAFT_INTEGRITY_MATCH')process.exitCode=1
 else console.log('NO DEPLOYMENT IS AUTHORIZED. This is a self-check of an unsigned operator draft.')
}
main().catch(e=>{console.error('R12 DRAFT REJECTED:',e instanceof Error?e.message:'unknown');process.exitCode=1})
