import { describe, expect, it } from 'vitest'
import { type Direction } from './board'
import {
  applyMove,
  createGame,
  current,
  currentBoard,
  decodeMoves,
  encodeMoves,
  moveList,
  redo,
  replay,
  seek,
  toBoard,
  undo,
  type Game,
} from './game'

const TWENTY: Direction[] = [
  'left', 'up', 'right', 'down', 'left', 'left', 'up', 'right', 'down', 'up',
  'left', 'down', 'right', 'up', 'left', 'down', 'down', 'right', 'up', 'left',
]

function play(game: Game, moves: readonly Direction[]): Game {
  return moves.reduce((g, d) => applyMove(g, d), game)
}

describe('createGame', () => {
  it('starts with two tiles and zero score', () => {
    const game = createGame(42)
    expect(current(game).tiles).toHaveLength(2)
    expect(current(game).score).toBe(0)
    expect(game.history).toHaveLength(1)
    expect(currentBoard(game).flat().filter((v) => v !== 0)).toHaveLength(2)
  })

  it('supports other board sizes', () => {
    expect(currentBoard(createGame(1, 3))).toHaveLength(3)
    expect(currentBoard(createGame(1, 5))).toHaveLength(5)
  })
})

describe('determinism', () => {
  it('two engines with seed 12345 match after the same 20 moves', () => {
    const a = play(createGame(12345), TWENTY)
    const b = play(createGame(12345), TWENTY)
    expect(currentBoard(a)).toEqual(currentBoard(b))
    expect(current(a).score).toBe(current(b).score)
    expect(a.history.length).toBe(b.history.length)
  })

  it('different seeds diverge', () => {
    const a = play(createGame(12345), TWENTY)
    const b = play(createGame(54321), TWENTY)
    expect(currentBoard(a)).not.toEqual(currentBoard(b))
  })
})

describe('applyMove', () => {
  it('returns the same game when nothing slides', () => {
    // Force a board where "left" is a no-op: two tiles already in column 0.
    const game = createGame(1)
    const packed = {
      ...game,
      history: [
        {
          ...current(game),
          tiles: [
            { id: 1, value: 2, r: 0, c: 0 },
            { id: 2, value: 4, r: 1, c: 0 },
          ],
        },
      ],
    }
    expect(applyMove(packed, 'left')).toBe(packed)
    expect(applyMove(packed, 'up')).toBe(packed)
  })

  it('keeps tile identities across a slide and records ghosts on merge', () => {
    const game = createGame(1)
    const packed: Game = {
      ...game,
      history: [
        {
          ...current(game),
          tiles: [
            { id: 1, value: 2, r: 0, c: 0 },
            { id: 2, value: 2, r: 0, c: 3 },
          ],
        },
      ],
    }
    const next = applyMove(packed, 'left')
    const snap = current(next)
    const merged = snap.tiles.find((t) => t.id === 1)
    expect(merged).toMatchObject({ value: 4, r: 0, c: 0, merged: true })
    expect(snap.ghosts).toEqual([{ id: 2, value: 2, r: 0, c: 0 }])
    expect(snap.tiles.filter((t) => t.spawned)).toHaveLength(1)
    expect(snap.score).toBe(4)
    expect(toBoard(snap.tiles, 4)[0][0]).toBe(4)
  })
})

describe('history', () => {
  it('undo and redo walk the cursor without losing snapshots', () => {
    const game = play(createGame(7), TWENTY.slice(0, 5))
    const len = game.history.length
    const back = undo(undo(game))
    expect(back.cursor).toBe(game.cursor - 2)
    expect(back.history).toHaveLength(len)
    expect(currentBoard(back)).toEqual(currentBoard(seek(game, game.cursor - 2)))
    expect(redo(redo(back))).toEqual(game)
    const fresh = createGame(7)
    expect(undo(fresh)).toBe(fresh) // nothing to undo: same reference
    expect(redo(game)).toBe(game) // nothing to redo: same reference
  })

  it('seek clamps to the history bounds', () => {
    const game = play(createGame(7), TWENTY)
    expect(seek(game, -5).cursor).toBe(0)
    expect(seek(game, 999).cursor).toBe(game.history.length - 1)
    expect(seek(game, game.cursor)).toBe(game)
  })

  it('moving after an undo discards the redo branch', () => {
    const game = play(createGame(7), TWENTY.slice(0, 10))
    const rewound = seek(game, 4)
    const branched = applyMove(rewound, 'down')
    expect(branched.history.length).toBeLessThanOrEqual(6)
    expect(branched.cursor).toBe(branched.history.length - 1)
  })

  it('a replayed move list reproduces the game exactly', () => {
    const game = play(createGame(12345), TWENTY)
    const moves = moveList(game)
    const again = replay(12345, 4, decodeMoves(encodeMoves(moves)))
    expect(currentBoard(again)).toEqual(currentBoard(game))
    expect(current(again).score).toBe(current(game).score)
    expect(encodeMoves(moves)).toMatch(/^[LRUD]+$/)
  })
})
