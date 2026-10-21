#!/usr/bin/env node
/** Read-only post-deploy incident packet: file + GitHub job summary only. */
import {readFile,writeFile,appendFile} from 'node:fs/promises'
import {classifyCustody,STATE,validateIncidentPacket} from './incident-core.mjs'

async function main(){
 let observation=null
 try{
   const text=await readFile('custody-report.json','utf8')
   if(text.length<=65536)observation=JSON.parse(text)
 }catch{ /* unassessed, not PASS */ }
 const packet=classifyCustody(observation,{
  commit:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,
  expectedManifestHash:process.env.EXPECTED_MANIFEST_SHA256,
 })
 if(!validateIncidentPacket(packet))throw new Error('PACKET_SCHEMA_INVALID')
 await writeFile('incident-report.json',JSON.stringify(packet,null,2)+'\n',{mode:0o644})
 const summary='### R11 Incident Desk: '+packet.state+'\n'+
  'Packet: `'+packet.incident_id+'` · evidence: `'+packet.evidence+'`.\n'+
  '**Post-deploy observation only. No automatic rollback or resolution.**\n'+
  packet.actions.map(x=>'- '+x.label).join('\n')+'\n'
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,summary)
 console.log('R11 '+packet.state+' '+packet.incident_id)
 // A valid incident record should not obscure R10's original failure.
 // UNKNOWN is explicitly not treated as a successful byte verification.
 if(packet.state!==STATE.NONE)console.log('R11 manual review required; no mutating actions performed.')
}
main().catch(error=>{
 console.error('R11 packet generation failed closed:',error instanceof Error?error.message:'Unknown')
 process.exitCode=1
})
