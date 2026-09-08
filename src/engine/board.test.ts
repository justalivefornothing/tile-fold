import { describe, expect, it } from 'vitest'
import {
  emptyCells,
  hasWon,
  isGameOver,
  move,
  rotate,
  rotateCW,
  slide,
  slideRow,
  spawn,
  traceRow,
  type Board,
} from './board'
import { createRng } from './rng'

describe('slideRow', () => {
  it('compresses and merges once left-to-right', () => {
    expect(slideRow([2, 2, 4, 0])).toEqual({ row: [4, 4, 0, 0], score: 4 })
  })

  it('merges each tile at most once', () => {
    expect(slideRow([2, 2, 2, 2])).toEqual({ row: [4, 4, 0, 0], score: 8 })
  })

  it('merges across gaps and prefers the leftmost pair', () => {
    expect(slideRow([2, 0, 2, 2])).toEqual({ row: [4, 2, 0, 0], score: 4 })
    expect(slideRow([0, 0, 0, 2])).toEqual({ row: [2, 0, 0, 0], score: 0 })
    expect(slideRow([0, 0, 0, 0])).toEqual({ row: [0, 0, 0, 0], score: 0 })
  })

  it('traces where every tile went', () => {
    expect(traceRow([2, 0, 2, 4]).moves).toEqual([
      { from: 0, to: 0, merged: false },
      { from: 2, to: 0, merged: true },
      { from: 3, to: 1, merged: false },
    ])
  })
})

describe('rotation', () => {
  const board: Board = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]

  it('rotates clockwise', () => {
    expect(rotateCW(board)).toEqual([
      [7, 4, 1],
      [8, 5, 2],
      [9, 6, 3],
    ])
  })

  it('four quarter turns are the identity', () => {
    expect(rotate(board, 4)).toEqual(board)
    expect(rotate(rotate(board, 3), 1)).toEqual(board)
  })
})

describe('slide', () => {
  const board: Board = [
    [2, 0, 0, 2],
    [0, 4, 0, 0],
    [0, 4, 0, 0],
    [2, 0, 0, 0],
  ]

  it('slides right', () => {
    expect(slide(board, 'right').board).toEqual([
      [0, 0, 0, 4],
      [0, 0, 0, 4],
      [0, 0, 0, 4],
      [0, 0, 0, 2],
    ])
  })

  it('slides up and merges the column', () => {
    const result = slide(board, 'up')
    expect(result.board).toEqual([
      [4, 8, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ])
    expect(result.score).toBe(12)
  })

  it('slides down and maps the trace back to board coordinates', () => {
    const result = slide(board, 'down')
    expect(result.board).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [4, 8, 0, 2],
    ])
    expect(result.moves).toContainEqual({ from: { r: 1, c: 1 }, to: { r: 3, c: 1 }, merged: true })
    expect(result.moves).toContainEqual({ from: { r: 0, c: 3 }, to: { r: 3, c: 3 }, merged: false })
  })
})

describe('move', () => {
  it('returns moved:false and does not spawn on an unchanged board', () => {
    const board: Board = [
      [2, 4, 0, 0],
      [8, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
    const rng = createRng(1)
    const result = move(board, 'left', rng)
    expect(result.moved).toBe(false)
    expect(result.spawned).toBeNull()
    expect(result.board).toBe(board)
    expect(result.rng).toBe(rng)
    expect(emptyCells(result.board)).toHaveLength(13)
  })

  it('spawns exactly one tile after a real move', () => {
    const board: Board = [
      [0, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
    const result = move(board, 'left', createRng(5))
    expect(result.moved).toBe(true)
    expect(result.board[0][0]).toBe(2)
    expect(result.spawned).not.toBeNull()
    expect(emptyCells(result.board)).toHaveLength(14)
    expect([2, 4]).toContain(result.spawned!.value)
  })
})

describe('spawn', () => {
  it('returns null on a full board', () => {
    expect(spawn([[2, 4], [8, 16]], createRng(1))).toBeNull()
  })

  it('spawns roughly 90% twos', () => {
    let rng = createRng(2024)
    let twos = 0
    const board: Board = [[0]]
    for (let i = 0; i < 1000; i++) {
      const placed = spawn(board, rng)!
      if (placed.cell.value === 2) twos++
      rng = placed.rng
    }
    expect(twos).toBeGreaterThan(850)
    expect(twos).toBeLessThan(950)
  })
})

describe('isGameOver', () => {
  it('is true for a checkerboard with no moves', () => {
    expect(
      isGameOver([
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ]),
    ).toBe(true)
  })

  it('is false when a cell is empty or neighbours match', () => {
    expect(
      isGameOver([
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 0],
      ]),
    ).toBe(false)
    expect(
      isGameOver([
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 4],
      ]),
    ).toBe(false)
    expect(
      isGameOver([
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 2],
        [4, 2, 4, 2],
      ]),
    ).toBe(false)
  })
})

describe('hasWon', () => {
  it('detects the target tile', () => {
    expect(hasWon([[2048, 0], [0, 0]])).toBe(true)
    expect(hasWon([[1024, 1024], [0, 0]])).toBe(false)
    expect(hasWon([[256, 0], [0, 0]], 256)).toBe(true)
  })
})
