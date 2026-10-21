/**
 * MINOTAUR R3.0
 * Browser-local authorization state-machine illustration.
 * No process isolation, networking, real tools, accounts, or persistence.
 * Capability decisions are pure data, never calls to executable actions.
 */
export const MINOTAUR_SCHEMA = 'whitehatledger369.minotaur.v1' as const
export const MINOTAUR_PACK = 'r3-lab-only-2026-10' as const

export const MINOTAUR_LEVELS = [
  { name: 'NORMAL', tier: 0, description: 'Training baseline; full fixture capability vocabulary.', capabilities: ['observe', 'inspect', 'simulate', 'export'] },
  { name: 'WATCH', tier: 1, description: 'First warning; fixture export capability withdrawn.', capabilities: ['observe', 'inspect', 'simulate'] },
  { name: 'RESTRICT', tier: 2, description: 'Additional warning; synthetic simulation capability withdrawn.', capabilities: ['observe', 'inspect'] },
  { name: 'SANDBOX', tier: 3, description: 'Inert demonstration state. This is NOT an OS sandbox.', capabilities: ['observe'] },
  { name: 'DECOY', tier: 4, description: 'Simulation of a decoy state; nothing is redirected or contacted.', capabilities: ['observe'] },
  { name: 'ISOLATE', tier: 5, description: 'Synthetic permissions are fully revoked; not a real container.', capabilities: [] },
  { name: 'QUARANTINE', tier: 6, description: 'Terminal simulated state; all synthetic actions remain denied.', capabilities: [] },
] as const

export type MinotaurTier = (typeof MINOTAUR_LEVELS)[number]['name']
export type MinotaurCapability = 'observe' | 'inspect' | 'simulate' | 'export' | 'grant'
export type MinotaurEventId =
  | 'SUSPICIOUS_INPUT'
  | 'UNAPPROVED_TOOL'
  | 'SCOPE_CROSSING'
  | 'REPEAT_ATTEMPT'
  | 'DECOY_TRIGGER'
  | 'REPEATED_VIOLATION'

export interface MinotaurTransition {
  sequence: number
  eventId: MinotaurEventId
  eventLabel: string
  from: MinotaurTier
  to: MinotaurTier
  withdrawn: string[]
  decision: 'ESCALATED' | 'ALREADY_QUARANTINED'
}

export interface MinotaurState {
  schema: typeof MINOTAUR_SCHEMA
  pack: typeof MINOTAUR_PACK
  level: number
  transitions: MinotaurTransition[]
}

export interface CapabilityCheck {
  capability: MinotaurCapability
  tier: MinotaurTier
  decision: 'ALLOW_FIXTURE_ONLY' | 'DENY'
  executed: false
}

export const MINOTAUR_EVENTS: readonly { id: MinotaurEventId; label: string; explanation: string }[] = [
  { id: 'SUSPICIOUS_INPUT', label: 'Suspicious text', explanation: 'A training indicator requests closer observation.' },
  { id: 'UNAPPROVED_TOOL', label: 'Unauthorized tool request', explanation: 'A fixture requests a capability beyond its grant.' },
  { id: 'SCOPE_CROSSING', label: 'Scope crossing', explanation: 'A simulated request names an unapproved fixture.' },
  { id: 'REPEAT_ATTEMPT', label: 'Repeated attempt', explanation: 'A previously denied request is repeated.' },
  { id: 'DECOY_TRIGGER', label: 'Decoy trigger', explanation: 'A test indicator activates an inert decoy tier.' },
  { id: 'REPEATED_VIOLATION', label: 'Persistent violation', explanation: 'The training session reaches the terminal quarantine tier.' },
]

export function createMinotaurState(): MinotaurState {
  return { schema: MINOTAUR_SCHEMA, pack: MINOTAUR_PACK, level: 0, transitions: [] }
}

export function currentTier(state: MinotaurState) {
  return MINOTAUR_LEVELS[Math.max(0, Math.min(MINOTAUR_LEVELS.length - 1, state.level))]
}

export function advanceMinotaur(state: MinotaurState, id: MinotaurEventId): MinotaurState {
  const event = MINOTAUR_EVENTS.find((item) => item.id === id)
  if (!event) throw new Error('Unknown Minotaur simulation event')
  if (!Number.isInteger(state.level) || state.level < 0 || state.level >= MINOTAUR_LEVELS.length) {
    throw new Error('Invalid synthetic state')
  }
  const previous = currentTier(state)
  const nextIndex = Math.min(state.level + 1, MINOTAUR_LEVELS.length - 1)
  const nextTier = MINOTAUR_LEVELS[nextIndex]
  const withdrawn = previous.capabilities.filter((capability: string) =>
    !nextTier.capabilities.some((candidate: string) => candidate === capability),
  )
  return {
    schema: MINOTAUR_SCHEMA,
    pack: MINOTAUR_PACK,
    level: nextIndex,
    transitions: [...state.transitions, {
      sequence: state.transitions.length + 1,
      eventId: event.id,
      eventLabel: event.label,
      from: previous.name,
      to: nextTier.name,
      withdrawn,
      decision: nextIndex === state.level ? 'ALREADY_QUARANTINED' : 'ESCALATED',
    }],
  }
}

export function checkSyntheticCapability(state: MinotaurState, capability: MinotaurCapability): CapabilityCheck {
  if (!['observe', 'inspect', 'simulate', 'export', 'grant'].includes(capability)) {
    throw new Error('Unknown simulated capability')
  }
  const tier = currentTier(state)
  const allowed = tier.capabilities.some((entry: string) => entry === capability)
  // No real operation is ever executed, even when the simulated verdict is ALLOW.
  return {
    capability,
    tier: tier.name,
    decision: allowed ? 'ALLOW_FIXTURE_ONLY' : 'DENY',
    executed: false,
  }
}

export function runMinotaurSequence() {
  let state = createMinotaurState()
  for (const event of MINOTAUR_EVENTS) state = advanceMinotaur(state, event.id)
  return state
}

export function createMinotaurObservation(state: MinotaurState, generatedAt = new Date()) {
  if (!Number.isFinite(generatedAt.getTime())) throw new Error('Invalid observation timestamp')
  return {
    schema: MINOTAUR_SCHEMA,
    fixture_pack: MINOTAUR_PACK,
    created_at: generatedAt.toISOString(),
    final_tier: currentTier(state).name,
    transitions: state.transitions,
    proof: 'UNSIGNED_SIMULATION_ONLY',
    limits: 'No deployed agent evaluated; no code executed; no real container or network isolation is implied.',
  }
}
