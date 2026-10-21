import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,mkdir,readFile,writeFile,rm,symlink} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {
  ARTIFACT_FILE,stampArtifactDirectory,verifyArtifactDirectory,
  validateArtifactManifest,isSafeArtifactPath,
} from './artifact-core.mjs'

async function fixture(fn){
 const directory=await mkdtemp(join(tmpdir(),'whl-r8-'))
 try{
  await mkdir(join(directory,'assets'))
  await writeFile(join(directory,'index.html'),'<html>synthetic</html>','utf8')
  await writeFile(join(directory,'assets','app.js'),'console.log("fixture")','utf8')
  return await fn(directory)
 }finally{await rm(directory,{recursive:true,force:true})}
}
test('stamps reproducible root over exact file bytes, excluding the manifest itself',()=>fixture(async dir=>{
 const hash='a'.repeat(64)
 const result=await stampArtifactDirectory(dir,{
   manifestSha256:hash,lockSha256:'b'.repeat(64),now:()=>new Date('2026-10-21T12:00:00.000Z')
 })
 assert.equal(result.file_count,2)
 assert.equal(validateArtifactManifest(result),true)
 assert.equal(result.files.some(x=>x.path===ARTIFACT_FILE),false)
 assert.equal((await verifyArtifactDirectory(dir,{
   manifestSha256:hash,lockSha256:'b'.repeat(64)
 })).status,'PASS')
 const second=await stampArtifactDirectory(dir,{
   manifestSha256:hash,lockSha256:'b'.repeat(64),now:()=>new Date('2026-10-21T12:00:00.000Z')
 })
 assert.equal(result.root_sha256,second.root_sha256)
}))
test('detects modified bytes, including same-size mutation',()=>fixture(async dir=>{
 await stampArtifactDirectory(dir)
 await writeFile(join(dir,'assets','app.js'),'console.log("FIXTURE")')
 assert.equal((await verifyArtifactDirectory(dir)).status,'FAIL')
}))
test('detects added and deleted files, not only declared entries',()=>fixture(async dir=>{
 await stampArtifactDirectory(dir)
 await writeFile(join(dir,'assets','new.js'),'unexpected')
 assert.equal((await verifyArtifactDirectory(dir)).status,'FAIL')
 await rm(join(dir,'assets','new.js'))
 await rm(join(dir,'index.html'))
 assert.equal((await verifyArtifactDirectory(dir)).status,'FAIL')
}))
test('detects altered manifest/checkpoint fields',()=>fixture(async dir=>{
 await stampArtifactDirectory(dir)
 const file=join(dir,ARTIFACT_FILE)
 const data=JSON.parse(await readFile(file,'utf8'))
 data.root_sha256='0'.repeat(64)
 await writeFile(file,JSON.stringify(data))
 assert.equal((await verifyArtifactDirectory(dir)).status,'FAIL')
}))
test('detects source digest mismatches and missing manifest',()=>fixture(async dir=>{
 assert.equal((await verifyArtifactDirectory(dir)).status,'UNKNOWN')
 await stampArtifactDirectory(dir,{manifestSha256:'a'.repeat(64)})
 assert.equal((await verifyArtifactDirectory(dir,{manifestSha256:'b'.repeat(64)})).status,'FAIL')
}))
test('rejects symlinks and traversal-like names',()=>fixture(async dir=>{
 for(const bad of ['../secrets','assets/../x','/absolute','assets//a','a\\b','artifact-manifest.json'])
    assert.equal(isSafeArtifactPath(bad),false)
 await symlink(join(dir,'index.html'),join(dir,'assets','linked.html'))
 await assert.rejects(()=>stampArtifactDirectory(dir),/UNSAFE_ARTIFACT_TYPE/)
}))
