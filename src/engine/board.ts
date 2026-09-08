import { nextFloat, nextInt, type Rng } from './rng'

export type Board = readonly (readonly number[])[]
export type Direction = 'left' | 'right' | 'up' | 'down'
export type Cell = { readonly r: number; readonly c: number }

/** Where one non-empty cell ended up after a slide. `merged` marks the tile that folded into its neighbour. */
export type CellMove = { readonly from: Cell; readonly to: Cell; readonly merged: boolean }

export type SlideResult = {
  readonly board: Board
  readonly score: number
  readonly moved: boolean
  readonly moves: readonly CellMove[]
}

export type MoveResult = SlideResult & {
  readonly rng: Rng
  readonly spawned: (Cell & { readonly value: number }) | null
}

export const DIRECTIONS: readonly Direction[] = ['left', 'right', 'up', 'down']

/** Quarter turns clockwise that turn each direction into "slide left". */
const TURNS: Record<Direction, number> = { left: 0, down: 1, right: 2, up: 3 }

export function emptyBoard(size: number): Board {
  return Array.from({ length: size }, () => Array<number>(size).fill(0))
}

/**
 * Slide a single row to the left, merging equal neighbours exactly once.
 * Returns the new row, the score gained and a per-tile trace.
 */
export function traceRow(row: readonly number[]): {
  row: number[]
  score: number
  moves: { from: number; to: number; merged: boolean }[]
} {
  const out = Array<number>(row.length).fill(0)
  const moves: { from: number; to: number; merged: boolean }[] = []
  let write = 0
  let score = 0
  let openToMerge = false

  for (let i = 0; i < row.length; i++) {
    const value = row[i]
    if (value === 0) continue
    if (openToMerge && out[write - 1] === value) {
      out[write - 1] = value * 2
      score += value * 2
      moves.push({ from: i, to: write - 1, merged: true })
      openToMerge = false
    } else {
      out[write] = value
      moves.push({ from: i, to: write, merged: false })
      write++
      openToMerge = true
    }
  }
  return { row: out, score, moves }
}

export function slideRow(row: readonly number[]): { row: number[]; score: number } {
  const { row: out, score } = traceRow(row)
  return { row: out, score }
}

export function rotateCW(board: Board): Board {
  const n = board.length
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => board[n - 1 - c][r]))
}

export function rotate(board: Board, quarterTurns: number): Board {
  let out = board
  for (let i = 0; i < ((quarterTurns % 4) + 4) % 4; i++) out = rotateCW(out)
  return out
}

function rotatePoint(p: Cell, n: number, quarterTurns: number): Cell {
  let { r, c } = p
  for (let i = 0; i < ((quarterTurns % 4) + 4) % 4; i++) {
    const nr = c
    const nc = n - 1 - r
    r = nr
    c = nc
  }
  return { r, c }
}

/**
 * Slide the whole board in a direction (no spawn). Rotates so the direction
 * becomes "left", slides every row, then rotates back — both the cells and
 * the movement trace.
 */
export function slide(board: Board, dir: Direction): SlideResult {
  const n = board.length
  const turns = TURNS[dir]
  const rotated = rotate(board, turns)
  const rows: number[][] = []
  const moves: CellMove[] = []
  let score = 0
  let moved = false

  rotated.forEach((row, r) => {
    const traced = traceRow(row)
    rows.push(traced.row)
    score += traced.score
    for (const m of traced.moves) {
      if (m.from !== m.to || m.merged) moved = true
      moves.push({
        from: rotatePoint({ r, c: m.from }, n, 4 - turns),
        to: rotatePoint({ r, c: m.to }, n, 4 - turns),
        merged: m.merged,
      })
    }
  })

  if (!moved) return { board, score: 0, moved: false, moves }
  return { board: rotate(rows, 4 - turns), score, moved: true, moves }
}

export function emptyCells(board: Board): Cell[] {
  const cells: Cell[] = []
  board.forEach((row, r) => row.forEach((v, c) => v === 0 && cells.push({ r, c })))
  return cells
}

/** Place a 2 (90%) or 4 (10%) on a random empty cell using the seeded generator. */
export function spawn(
  board: Board,
  rng: Rng,
): { board: Board; rng: Rng; cell: Cell & { value: number } } | null {
  const empties = emptyCells(board)
  if (empties.length === 0) return null
  const pick = nextInt(rng, empties.length)
  const roll = nextFloat(pick.rng)
  const value = roll.value < 0.9 ? 2 : 4
  const { r, c } = empties[pick.value]
  const next = board.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? value : v)) : row))
  return { board: next, rng: roll.rng, cell: { r, c, value } }
}

/** One full turn: slide, and if anything moved, spawn a tile. */
export function move(board: Board, dir: Direction, rng: Rng): MoveResult {
  const slid = slide(board, dir)
  if (!slid.moved) return { ...slid, rng, spawned: null }
  const placed = spawn(slid.board, rng)
  if (!placed) return { ...slid, rng, spawned: null }
  return { ...slid, board: placed.board, rng: placed.rng, spawned: placed.cell }
}

/** No empty cells and no equal neighbours horizontally or vertically. */
export function isGameOver(board: Board): boolean {
  const n = board.length
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const v = board[r][c]
      if (v === 0) return false
      if (c + 1 < n && board[r][c + 1] === v) return false
      if (r + 1 < n && board[r + 1][c] === v) return false
    }
  }
  return true
}

export function hasWon(board: Board, target = 2048): boolean {
  return board.some((row) => row.some((v) => v >= target))
}

export function maxTile(board: Board): number {
  return board.reduce((m, row) => Math.max(m, ...row), 0)
}

export function boardsEqual(a: Board, b: Board): boolean {
  return a.length === b.length && a.every((row, r) => row.length === b[r].length && row.every((v, c) => v === b[r][c]))
}
