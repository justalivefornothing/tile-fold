import { describe, expect, it } from 'vitest'
import { createRng, nextFloat, nextInt, seedFromString } from './rng'

function take(seed: number, count: number): number[] {
  let rng = createRng(seed)
  const out: number[] = []
  for (let i = 0; i < count; i++) {
    const draw = nextFloat(rng)
    out.push(draw.value)
    rng = draw.rng
  }
  return out
}

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    expect(take(12345, 8)).toEqual(take(12345, 8))
  })

  it('produces different sequences for different seeds', () => {
    expect(take(1, 4)).not.toEqual(take(2, 4))
  })

  it('stays within [0, 1)', () => {
    for (const v of take(99, 500)) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('does not mutate the generator it is given', () => {
    const rng = createRng(7)
    const a = nextFloat(rng)
    const b = nextFloat(rng)
    expect(a.value).toBe(b.value)
    expect(rng.state).toBe(7)
  })

  it('nextInt stays within range', () => {
    let rng = createRng(3)
    for (let i = 0; i < 200; i++) {
      const draw = nextInt(rng, 5)
      expect(draw.value).toBeGreaterThanOrEqual(0)
      expect(draw.value).toBeLessThan(5)
      rng = draw.rng
    }
  })
})

describe('seedFromString', () => {
  it('uses numeric strings verbatim', () => {
    expect(seedFromString(' 12345 ')).toBe(12345)
  })

  it('hashes text deterministically into a uint32', () => {
    const a = seedFromString('kraft paper')
    expect(a).toBe(seedFromString('kraft paper'))
    expect(a).not.toBe(seedFromString('kraft papers'))
    expect(Number.isInteger(a) && a >= 0 && a <= 0xffffffff).toBe(true)
  })
})
