#!/usr/bin/env node
import {readFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {hashText,stampArtifactDirectory,verifyArtifactDirectory} from './artifact-core.mjs'

const command=process.argv[2]
if(!['stamp','verify'].includes(command)){
 console.error('Usage: npm run artifact:stamp or npm run artifact:verify (dist/ only)')
 process.exitCode=2
}else{
 try{
  const [pkg,lock]=await Promise.all([
    readFile(resolve('package.json'),'utf8'),
    readFile(resolve('package-lock.json'),'utf8')])
  const hashes={manifestSha256:hashText(pkg),lockSha256:hashText(lock)}
  if(command==='stamp'){
    const manifest=await stampArtifactDirectory(resolve('dist'),{
      ...hashes,commit:process.env.GITHUB_SHA??null,
    })
    console.log(`R8 stamped ${manifest.file_count} build files (${manifest.total_bytes} bytes), root SHA256 ${manifest.root_sha256}`)
    console.log('Manifest is UNSIGNED and does NOT independently attest the deployed website.')
  }else{
    const verdict=await verifyArtifactDirectory(resolve('dist'),hashes)
    console.log(JSON.stringify(verdict,null,2))
    if(verdict.status!=='PASS')process.exitCode=1
  }
 }catch(e){
  console.error('R8 artifact verification failed closed:',e instanceof Error?e.message:'unknown')
  process.exitCode=1
 }
}
