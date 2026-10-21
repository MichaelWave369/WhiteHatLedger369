/**
 * R5: Independent browser-side verifier for a fixed, OWNED, signed synthetic ledger.
 * The verifier cannot mint signatures and has no real agent/tool access.
 * Trusted Ed25519 PUBLIC key is compiled in source, not supplied by a report.
 */
export const EVIDENCE_SCHEMA = 'whitehatledger369.evidence-ledger.v1' as const
export const RECEIPT_SCHEMA = 'whitehatledger369.receipt.v1' as const
export const CHECKPOINT_SCHEMA = 'whitehatledger369.checkpoint.v1' as const
export const EVIDENCE_DOMAIN = 'WHL369-R5-ENTRY-V1\n'
export const CHECKPOINT_DOMAIN = 'WHL369-R5-CHECKPOINT-V1\n'
export const PINNED_PUBLIC_KEY = '-Ym9ee4U6o3sgpBqnrXDwmLhJQ1Iv6TrYp5CiBeM2bQ'
export const DEMO_LEDGER_ID = 'r5-synthetic-lab-01'
export const DEMO_ISSUER = 'whitehat369-r5-demo'
const LAB_SUBJECT = 'lab://whitehat369/evidence'
const HASH_PATTERN = /^[a-f0-9]{64}$/
const DEMO_KINDS = ['SCOPE','OBSERVATION','RETEST'] as const
const MAX_RECORDS = 32

export interface EvidenceRecord {
  schema: typeof RECEIPT_SCHEMA
  sequence: number
  previous: string
  subject: string
  kind: 'SCOPE' | 'OBSERVATION' | 'RETEST'
  summary: string
  observedAt: string
  provenance: 'SIMULATED'
  hash: string
}
export interface EvidenceCheckpoint {
  schema: typeof CHECKPOINT_SCHEMA
  ledgerId: string
  issuer: string
  recordCount: number
  head: string
  issuedAt: string
}
export interface EvidenceLedger {
  schema: typeof EVIDENCE_SCHEMA
  checkpoint: EvidenceCheckpoint
  signature: string
  records: EvidenceRecord[]
  disclaimer: string
}
export interface RecordInspection {
  sequence: number
  kind: string
  integrity: 'MATCH' | 'BROKEN'
}
export type EvidenceStatus = 'VERIFIED_SAMPLE' | 'REJECTED' | 'CRYPTO_UNAVAILABLE'
export interface EvidenceVerification {
  status: EvidenceStatus
  reason: string
  chainValid: boolean
  signatureValid: boolean
  inspected: RecordInspection[]
  claimsVerified: boolean
}

const encode = (input: string) => new TextEncoder().encode(input)
function base64url(input: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(input)) return null
  try {
    const text = atob(input.replace(/-/g,'+').replace(/_/g,'/'))
    return Uint8Array.from(text, c => c.charCodeAt(0))
  } catch { return null }
}
function plain(x: unknown): x is Record<string,unknown> {
  return !!x && typeof x==='object' && !Array.isArray(x) && Object.getPrototypeOf(x)===Object.prototype
}
function keys(x: Record<string,unknown>, expected: string[]): boolean {
  const own=Object.keys(x)
  return own.length===expected.length && own.every(key=>expected.includes(key))
}
function isoTime(x: unknown): x is string {
  if(typeof x!=='string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x)) return false
  const ms=Date.parse(x)
  return Number.isFinite(ms) && new Date(ms).toISOString()===x
}
export function canonicalRecord(input: EvidenceRecord): string {
  return JSON.stringify({
    schema:input.schema, sequence:input.sequence, previous:input.previous,
    subject:input.subject, kind:input.kind, summary:input.summary,
    observedAt:input.observedAt, provenance:input.provenance,
  })
}
export function canonicalCheckpoint(input: EvidenceCheckpoint): string {
  return JSON.stringify({
    schema:input.schema, ledgerId:input.ledgerId, issuer:input.issuer,
    recordCount:input.recordCount, head:input.head, issuedAt:input.issuedAt,
  })
}
async function sha256(text: string): Promise<string> {
  const raw=await crypto.subtle.digest('SHA-256',encode(text) as BufferSource)
  return Array.from(new Uint8Array(raw),b=>b.toString(16).padStart(2,'0')).join('')
}

export function inspectEvidenceShape(payload: unknown): payload is EvidenceLedger {
  if (!plain(payload) || !keys(payload,['schema','checkpoint','signature','records','disclaimer']) ||
      payload.schema!==EVIDENCE_SCHEMA || !plain(payload.checkpoint) ||
      !keys(payload.checkpoint,['schema','ledgerId','issuer','recordCount','head','issuedAt']) ||
      !Array.isArray(payload.records) || payload.records.length < 1 || payload.records.length>MAX_RECORDS ||
      typeof payload.signature!=='string' || payload.signature.length>256 ||
      typeof payload.disclaimer!=='string' || payload.disclaimer.length>500) return false

  const cp=payload.checkpoint
  if(cp.schema!==CHECKPOINT_SCHEMA || cp.ledgerId!==DEMO_LEDGER_ID ||
     cp.issuer!==DEMO_ISSUER || !Number.isSafeInteger(cp.recordCount) ||
     cp.recordCount!==payload.records.length ||
     typeof cp.head!=='string' || !HASH_PATTERN.test(cp.head) ||
     !isoTime(cp.issuedAt)) return false

  for(const rec of payload.records){
    if(!plain(rec) || !keys(rec,['schema','sequence','previous','subject','kind','summary','observedAt','provenance','hash']) ||
       rec.schema!==RECEIPT_SCHEMA || !Number.isSafeInteger(rec.sequence) ||
       (typeof rec.previous!=='string' || (rec.previous!=='GENESIS' && !HASH_PATTERN.test(rec.previous))) ||
       rec.subject!==LAB_SUBJECT || !DEMO_KINDS.includes(rec.kind as typeof DEMO_KINDS[number]) ||
       typeof rec.summary!=='string' || rec.summary.length<1 || rec.summary.length>320 ||
       !isoTime(rec.observedAt) || rec.provenance!=='SIMULATED' ||
       typeof rec.hash!=='string' || !HASH_PATTERN.test(rec.hash)) return false
  }
  return true
}

function reject(reason: string, inspected: RecordInspection[] = [], chainValid = false, signatureValid = false): EvidenceVerification {
  return {status:'REJECTED', reason, chainValid, signatureValid, inspected, claimsVerified:false}
}

export async function verifyEvidenceLedger(input: unknown): Promise<EvidenceVerification> {
  if(!inspectEvidenceShape(input)) return reject('INVALID_SCHEMA_OR_SCOPE')
  if(!globalThis.crypto?.subtle) return {status:'CRYPTO_UNAVAILABLE',reason:'WEB_CRYPTO_UNAVAILABLE',chainValid:false,signatureValid:false,inspected:[],claimsVerified:false}

  const inspected: RecordInspection[]=[]
  let expectedPrevious='GENESIS'
  let chainValid=true
  let lastTime=-Infinity
  try {
    for(let i=0;i<input.records.length;i++){
      const rec=input.records[i]
      const actual=await sha256(EVIDENCE_DOMAIN + canonicalRecord(rec))
      const time=Date.parse(rec.observedAt)
      const valid=rec.sequence===i+1 && rec.previous===expectedPrevious && rec.hash===actual &&
        time>=lastTime && time<=Date.parse(input.checkpoint.issuedAt)
      inspected.push({sequence:rec.sequence,kind:rec.kind,integrity:valid?'MATCH':'BROKEN'})
      if(!valid)chainValid=false
      expectedPrevious=rec.hash
      lastTime=time
    }
  } catch {
    return {status:'CRYPTO_UNAVAILABLE',reason:'WEB_CRYPTO_ERROR',chainValid:false,signatureValid:false,inspected,claimsVerified:false}
  }
  if(input.checkpoint.head!==expectedPrevious)chainValid=false

  const key=base64url(PINNED_PUBLIC_KEY), signature=base64url(input.signature)
  if(!key || key.length!==32 || !signature || signature.length!==64)
    return reject('INVALID_SIGNATURE_BYTES', inspected, chainValid)

  let signatureValid=false
  try {
    const imported=await crypto.subtle.importKey('raw',key as BufferSource,'Ed25519',false,['verify'])
    const message=encode(CHECKPOINT_DOMAIN+canonicalCheckpoint(input.checkpoint))
    signatureValid=await crypto.subtle.verify('Ed25519',imported,signature as BufferSource,message as BufferSource)
  } catch {
    return {status:'CRYPTO_UNAVAILABLE',reason:'ED25519_UNAVAILABLE',chainValid,signatureValid:false,inspected,claimsVerified:false}
  }
  if(!chainValid)return reject('HASH_CHAIN_BROKEN',inspected,false,signatureValid)
  if(!signatureValid)return reject('UNTRUSTED_OR_MODIFIED_CHECKPOINT',inspected,true,false)
  return {status:'VERIFIED_SAMPLE',reason:'PINNED_SAMPLE_SIGNATURE_AND_CHAIN_MATCH',chainValid:true,signatureValid:true,inspected,claimsVerified:true}
}

export function cloneEvidenceLedger(ledger: EvidenceLedger): EvidenceLedger {
  return JSON.parse(JSON.stringify(ledger)) as EvidenceLedger
}
export type TamperCase = 'clean' | 'alter-summary' | 'remove-record' | 'swap-records' | 'forge-checkpoint'
export function withEvidenceTamper(ledger: EvidenceLedger, tamper: TamperCase): EvidenceLedger {
  const copy=cloneEvidenceLedger(ledger)
  if(tamper==='alter-summary')copy.records[1].summary+=' UNAUTHORIZED EDIT'
  if(tamper==='remove-record')copy.records.splice(1,1)
  if(tamper==='swap-records') [copy.records[0],copy.records[1]]=[copy.records[1],copy.records[0]]
  if(tamper==='forge-checkpoint')copy.checkpoint.head='0'.repeat(64)
  return copy
}
