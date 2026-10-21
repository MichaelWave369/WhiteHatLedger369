/**
 * R5 SECOND verifier: Node.js implementation independent of the browser's
 * Web Crypto implementation. Fixed pinned PUBLIC demo key only, no signing.
 */
import { createHash, createPublicKey, verify as verifySignature } from 'node:crypto'
export const PINNED_R5_PUBLIC = '-Ym9ee4U6o3sgpBqnrXDwmLhJQ1Iv6TrYp5CiBeM2bQ'
const RECORD_FIELDS = ['schema','sequence','previous','subject','kind','summary','observedAt','provenance','hash']
const CHECKPOINT_FIELDS = ['schema','ledgerId','issuer','recordCount','head','issuedAt']
const hashPattern = /^[a-f0-9]{64}$/
const entryPrefix = 'WHL369-R5-ENTRY-V1\n'
const checkpointPrefix = 'WHL369-R5-CHECKPOINT-V1\n'
const exactKeys = (obj,fields) => obj && typeof obj === 'object' && !Array.isArray(obj) &&
  Object.keys(obj).length===fields.length && Object.keys(obj).every(key=>fields.includes(key))
const fail = (reason) => ({ ok: false, reason, signatureValid: false, chainValid: false, recordsChecked: 0 })
const isTime = s => typeof s==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s) && Number.isFinite(Date.parse(s)) &&
  new Date(Date.parse(s)).toISOString()===s

export function verifyEvidenceOnNode(payload) {
  if (!exactKeys(payload,['schema','checkpoint','signature','records','disclaimer']) ||
      payload.schema!=='whitehatledger369.evidence-ledger.v1' ||
      !exactKeys(payload.checkpoint,CHECKPOINT_FIELDS) ||
      !Array.isArray(payload.records) || payload.records.length<1 || payload.records.length>32 ||
      typeof payload.signature!=='string' || !/^[A-Za-z0-9_-]+$/.test(payload.signature) ||
      typeof payload.disclaimer!=='string' || payload.disclaimer.length>500) return fail('INVALID_SCHEMA')

  const cp=payload.checkpoint
  if(cp.schema!=='whitehatledger369.checkpoint.v1' || cp.ledgerId!=='r5-synthetic-lab-01' ||
     cp.issuer!=='whitehat369-r5-demo' || !Number.isSafeInteger(cp.recordCount) ||
     cp.recordCount!==payload.records.length || typeof cp.head!=='string' ||
     !hashPattern.test(cp.head) || !isTime(cp.issuedAt)) return fail('INVALID_CHECKPOINT')
  let previous='GENESIS'
  let earlier=-Infinity
  let checked=0
  for (const r of payload.records){
    if(!exactKeys(r,RECORD_FIELDS) || r.schema!=='whitehatledger369.receipt.v1' ||
       !Number.isSafeInteger(r.sequence) || r.sequence!==checked+1 ||
       r.subject!=='lab://whitehat369/evidence' || !['SCOPE','OBSERVATION','RETEST'].includes(r.kind) ||
       r.provenance!=='SIMULATED' || typeof r.summary!=='string' ||
       r.summary.length<1 || r.summary.length>320 || !isTime(r.observedAt) ||
       typeof r.hash!=='string' || !hashPattern.test(r.hash) || r.previous!==previous ||
       Date.parse(r.observedAt)<earlier || Date.parse(r.observedAt)>Date.parse(cp.issuedAt))
      return { ...fail('INVALID_OR_REORDERED_RECORD'), recordsChecked:checked }
    const canonical=JSON.stringify({
      schema:r.schema,sequence:r.sequence,previous:r.previous,subject:r.subject,
      kind:r.kind,summary:r.summary,observedAt:r.observedAt,provenance:r.provenance,
    })
    const actual=createHash('sha256').update(entryPrefix+canonical,'utf8').digest('hex')
    if(actual!==r.hash)return { ...fail('RECEIPT_HASH_MISMATCH'), recordsChecked:checked }
    previous=r.hash
    earlier=Date.parse(r.observedAt)
    checked++
  }
  if(previous!==cp.head)return {...fail('HEAD_MISMATCH'),recordsChecked:checked}
  const canonicalCheckpoint=JSON.stringify({
    schema:cp.schema,ledgerId:cp.ledgerId,issuer:cp.issuer,recordCount:cp.recordCount,
    head:cp.head,issuedAt:cp.issuedAt,
  })
  const key=Buffer.from(PINNED_R5_PUBLIC,'base64url')
  const signature=Buffer.from(payload.signature,'base64url')
  if(key.length!==32 || signature.length!==64)return {...fail('BAD_SIGNATURE_LENGTH'),recordsChecked:checked}
  // SPKI prefix for the raw Ed25519 public key (OID 1.3.101.112).
  const spki=Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),key])
  let signatureValid=false
  try {
    signatureValid=verifySignature(
      null,Buffer.from(checkpointPrefix+canonicalCheckpoint,'utf8'),
      createPublicKey({key:spki,format:'der',type:'spki'}),signature,
    )
  } catch {
    return {...fail('ED25519_UNAVAILABLE'),recordsChecked:checked}
  }
  if(!signatureValid)return {...fail('CHECKPOINT_SIGNATURE_INVALID'),recordsChecked:checked,chainValid:true}
  return {ok:true,reason:'TRUSTED_SAMPLE_CHAIN_AND_SIGNED_HEAD',signatureValid:true,chainValid:true,recordsChecked:checked}
}
