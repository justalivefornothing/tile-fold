/**
 * mulberry32 — a tiny 32-bit seeded PRNG.
 *
 * Modelled as a pure function: every draw returns the value *and* the
 * advanced generator, so a generator can live inside an immutable snapshot
 * and be replayed deterministically.
 */
export type Rng = { readonly state: number }

export function createRng(seed: number): Rng {
  return { state: seed >>> 0 }
}

/** Returns a float in [0, 1) and the next generator state. */
export function nextFloat(rng: Rng): { value: number; rng: Rng } {
  const state = (rng.state + 0x6d2b79f5) | 0
  let t = Math.imul(state ^ (state >>> 15), 1 | state)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { value, rng: { state } }
}

/** Returns an integer in [0, maxExclusive) and the next generator state. */
export function nextInt(rng: Rng, maxExclusive: number): { value: number; rng: Rng } {
  const draw = nextFloat(rng)
  return { value: Math.floor(draw.value * maxExclusive), rng: draw.rng }
}

/** FNV-1a hash so any text can be used as a seed. Digits are used verbatim. */
export function seedFromString(text: string): number {
  const trimmed = text.trim()
  if (/^\d{1,10}$/.test(trimmed)) {
    const n = Number(trimmed)
    if (n <= 0xffffffff) return n
  }
  let hash = 0x811c9dc5
  for (let i = 0; i < trimmed.length; i++) {
    hash ^= trimmed.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** A friendly six-digit seed for fresh games. */
export function randomSeed(): number {
  const buf = new Uint32Array(1)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(buf)
  } else {
    buf[0] = Math.floor(Math.random() * 0xffffffff)
  }
  return 100000 + (buf[0] % 900000)
}
