import {createHash} from 'node:crypto'
import {readFileSync,readdirSync,lstatSync} from 'node:fs'
import {join,relative,resolve} from 'node:path'
import {isDeepStrictEqual} from 'node:util'

export const POLICY = Object.freeze({
  "schema": "WHL369-PLUR-POLICY-V1",
  "version": "0.1.0",
  "name": "SuperWhiteHat PLUR Division",
  "rules": [
    {
      "id": "PLUR-P-001",
      "principle": "Peace",
      "severity": "BLOCK",
      "description": "Decoded payload passed immediately to eval"
    },
    {
      "id": "PLUR-P-002",
      "principle": "Peace",
      "severity": "BLOCK",
      "description": "Download piped directly into a shell"
    },
    {
      "id": "PLUR-L-001",
      "principle": "Love",
      "severity": "REVIEW",
      "description": "Potential hardcoded credential literal"
    },
    {
      "id": "PLUR-L-002",
      "principle": "Love",
      "severity": "REVIEW",
      "description": "Environment secrets file included in source tree"
    },
    {
      "id": "PLUR-U-001",
      "principle": "Unity",
      "severity": "REVIEW",
      "description": "PLUR enforcement bypass indicator"
    },
    {
      "id": "PLUR-R-001",
      "principle": "Respect",
      "severity": "REVIEW",
      "description": "Environment value interpolated in outbound fetch"
    },
    {
      "id": "PLUR-R-002",
      "principle": "Respect",
      "severity": "REVIEW",
      "description": "Broad filesystem permission assignment"
    }
  ]
})
export const SCHEMA = 'WHL369-PLUR-REPORT-V1'
const SKIP_DIRS = new Set(['.git','node_modules','dist','coverage','.vite','.next','vendor','docs','public'])
const CODE_FILE = /\.(?:[cm]?js|jsx|[cm]?ts|tsx|py|sh|ps1|ya?ml|json)$/i
const MAX_FILES = 1200
const MAX_BYTES = 1024 * 1024
const MAX_DEPTH = 16
const sha256 = value => createHash('sha256').update(value).digest('hex')
const safePath = path => path.replaceAll('\\','/')
const isTest = p => /(?:^|\/)(?:__tests__|fixtures?|testdata)\//i.test(p) || /\.(?:test|spec)\.[cm]?[jt]sx?$/i.test(p) || /\.offline\.mjs$/i.test(p)
const rules = [
 {id:'PLUR-P-001',pattern:/\beval\s*\(\s*(?:atob\s*\(|Buffer\.from\s*\()/i},
 {id:'PLUR-P-002',pattern:/\b(?:curl|wget)\b[^\r\n|]{0,160}\|\s*(?:sh|bash)\b/i},
 {id:'PLUR-L-001',pattern:/(?:GITHUB_TOKEN|AWS_SECRET_ACCESS_KEY|PRIVATE_KEY)\s*[:=]\s*["'][A-Za-z0-9+/_=-]{24,}["']/i},
 {id:'PLUR-U-001',pattern:/(?:PLUR_DISABLE|PLUR_SKIP)\s*=\s*(?:true|1)\b/i},
 {id:'PLUR-R-001',pattern:/\bfetch\s*\([^\r\n]{0,200}process\.env\.[A-Z][A-Z0-9_]*/i},
 {id:'PLUR-R-002',pattern:/\bchmod\s+777\b/i}
]
const knownRules = new Map(POLICY.rules.map(rule => [rule.id,rule]))

function inventory(root) {
 const files=[]
 const problems=[]
 function walk(dir,depth) {
  if (depth > MAX_DEPTH) {problems.push({path:safePath(relative(root,dir)),reason:'DEPTH_LIMIT'});return}
  let entries
  try {entries=readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'))}
  catch {problems.push({path:safePath(relative(root,dir)),reason:'UNREADABLE_DIRECTORY'});return}
  for (const entry of entries) {
   const full=join(dir,entry.name)
   const name=safePath(relative(root,full))
   if (entry.isSymbolicLink()) {problems.push({path:name,reason:'SYMLINK_NOT_SCANNED'});continue}
   if (entry.isDirectory()) {
    if (!SKIP_DIRS.has(entry.name)) walk(full,depth+1)
    continue
   }
   if (!entry.isFile() || (!CODE_FILE.test(name) && !/^(?:.*\/)?\.env(?:\.[^\/]+)?$/.test(name))) continue
   if (isTest(name) || (name.startsWith('policies/') && name.endsWith('.json'))) continue
   if (files.length >= MAX_FILES) {problems.push({path:name,reason:'FILE_LIMIT'});return}
   let stats
   try {stats=lstatSync(full)} catch {problems.push({path:name,reason:'FILE_CHANGED'});continue}
   if (!stats.isFile() || stats.size > MAX_BYTES) {problems.push({path:name,reason:'UNSCANNABLE_FILE'});continue}
   files.push({name,full})
  }
 }
 walk(root,0)
 return {files:files.sort((a,b)=>a.name.localeCompare(b.name,'en')),problems}
}

export function checkProject(directory,{sourceCommitClaim=null}={}) {
 const root=resolve(directory)
 const files=[]
 const findings=[]
 const problems=[]
 let policySha256=null
 try {
  const raw=readFileSync(join(root,'policies/plur-v0.1.json'))
  policySha256=sha256(raw)
  const policy=JSON.parse(raw.toString('utf8'))
  if (!isDeepStrictEqual(policy,POLICY)) problems.push({path:'policies/plur-v0.1.json',reason:'POLICY_MISMATCH'})
 } catch {problems.push({path:'policies/plur-v0.1.json',reason:'POLICY_MISSING_OR_INVALID'})}
 let rootStat
 try {rootStat=lstatSync(root)}catch {problems.push({path:'.',reason:'ROOT_UNAVAILABLE'})}
 if (rootStat && !rootStat.isDirectory()) problems.push({path:'.',reason:'ROOT_NOT_DIRECTORY'})
 if (rootStat?.isDirectory()) {
  const inventoryResult=inventory(root)
  problems.push(...inventoryResult.problems)
  for (const item of inventoryResult.files) {
   let bytes
   try {bytes=readFileSync(item.full)}catch {problems.push({path:item.name,reason:'UNREADABLE_FILE'});continue}
   if (bytes.byteLength>MAX_BYTES) {problems.push({path:item.name,reason:'FILE_CHANGED_OR_TOO_LARGE'});continue}
   files.push({path:item.name,sha256:sha256(bytes)})
   if (/^(?:.*\/)?\.env(?:\.(?!example$|sample$)[^\/]+)?$/i.test(item.name)) {
    findings.push({path:item.name,line:1,rule_id:'PLUR-L-002',severity:'REVIEW'})
   }
   const lines=bytes.toString('utf8').split(/\r?\n/)
   for (let index=0;index<lines.length;index++) {
    const line=lines[index]
    for (const rule of rules) {
     if (rule.pattern.test(line)) {
      findings.push({path:item.name,line:index+1,rule_id:rule.id,severity:knownRules.get(rule.id).severity})
     }
    }
   }
  }
 }
 const order=(a,b)=>a.path.localeCompare(b.path,'en') || (a.line??0)-(b.line??0) || (a.rule_id??a.reason).localeCompare(b.rule_id??b.reason)
 findings.sort(order); problems.sort(order)
 const status=findings.some(f=>f.severity==='BLOCK')?'BLOCK':problems.length?'UNKNOWN':findings.length?'REVIEW':'PASS'
 const packet={
  schema:SCHEMA,policy_version:POLICY.version,policy_sha256:policySha256,
  source_commit_claim:/^[0-9a-f]{40}$/.test(sourceCommitClaim??'')?sourceCommitClaim:null,
  scope:'STATIC_HEURISTICS_ONLY',status,scanned_files:files.length,
  files,findings,problems,
  enforcement:'LOCAL_CHECK_ONLY',signed:false,certified_secure:false
 }
 return {...packet,receipt_sha256:sha256('WHL369-PLUR-RECEIPT-V1\n'+JSON.stringify(packet))}
}
