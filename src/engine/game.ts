import { emptyBoard, slide, spawn, type Board, type Direction } from './board'
import { createRng, type Rng } from './rng'

/** A tile with a stable identity so the UI can animate it between snapshots. */
export type Tile = {
  readonly id: number
  readonly value: number
  readonly r: number
  readonly c: number
  /** This tile doubled during the move that produced the snapshot. */
  readonly merged?: boolean
  /** This tile was spawned by the move that produced the snapshot. */
  readonly spawned?: boolean
}

/** One immutable state of the game. `history` is simply an array of these. */
export type Snapshot = {
  readonly tiles: readonly Tile[]
  /** Tiles from the previous snapshot that folded into a neighbour, placed at their destination. */
  readonly ghosts: readonly Tile[]
  readonly score: number
  readonly rng: Rng
  readonly nextId: number
  readonly dir: Direction | null
}

export type Game = {
  readonly seed: number
  readonly size: number
  readonly history: readonly Snapshot[]
  /** Index into history of the snapshot being shown. Undo/redo/replay all just move this. */
  readonly cursor: number
}

export const SIZES = [3, 4, 5] as const
export type Size = (typeof SIZES)[number]

export function winTarget(size: number): number {
  return size <= 3 ? 256 : 2048
}

export function toBoard(tiles: readonly Tile[], size: number): Board {
  const board = emptyBoard(size).map((row) => [...row])
  for (const t of tiles) board[t.r][t.c] = t.value
  return board
}

export function current(game: Game): Snapshot {
  return game.history[game.cursor]
}

export function currentBoard(game: Game): Board {
  return toBoard(current(game).tiles, game.size)
}

export function moveList(game: Game): Direction[] {
  return game.history.slice(1, game.cursor + 1).map((s) => s.dir as Direction)
}

function spawnTile(
  tiles: readonly Tile[],
  size: number,
  rng: Rng,
  nextId: number,
): { tiles: readonly Tile[]; rng: Rng; nextId: number } {
  const placed = spawn(toBoard(tiles, size), rng)
  if (!placed) return { tiles, rng, nextId }
  const { r, c, value } = placed.cell
  return { tiles: [...tiles, { id: nextId, value, r, c, spawned: true }], rng: placed.rng, nextId: nextId + 1 }
}

export function createGame(seed: number, size: number = 4): Game {
  let state = { tiles: [] as readonly Tile[], rng: createRng(seed), nextId: 1 }
  state = spawnTile(state.tiles, size, state.rng, state.nextId)
  state = spawnTile(state.tiles, size, state.rng, state.nextId)
  const first: Snapshot = { tiles: state.tiles, ghosts: [], score: 0, rng: state.rng, nextId: state.nextId, dir: null }
  return { seed, size, history: [first], cursor: 0 }
}

/**
 * Apply a move to the snapshot under the cursor. If nothing slides, the game
 * is returned unchanged (same reference) and no tile is spawned. Otherwise the
 * new snapshot is appended and any redo-able future is discarded.
 */
export function applyMove(game: Game, dir: Direction): Game {
  const snap = current(game)
  const result = slide(toBoard(snap.tiles, game.size), dir)
  if (!result.moved) return game

  const at = new Map<string, Tile>()
  for (const t of snap.tiles) at.set(`${t.r},${t.c}`, t)

  const survivors: Tile[] = []
  const ghosts: Tile[] = []
  const mergedInto = new Set<string>()
  for (const m of result.moves) {
    const tile = at.get(`${m.from.r},${m.from.c}`)
    if (!tile) continue
    if (m.merged) {
      ghosts.push({ id: tile.id, value: tile.value, r: m.to.r, c: m.to.c })
      mergedInto.add(`${m.to.r},${m.to.c}`)
    } else {
      survivors.push({ id: tile.id, value: tile.value, r: m.to.r, c: m.to.c })
    }
  }
  const tiles: Tile[] = survivors.map((t) =>
    mergedInto.has(`${t.r},${t.c}`) ? { ...t, value: t.value * 2, merged: true } : t,
  )

  const placed = spawnTile(tiles, game.size, snap.rng, snap.nextId)
  const next: Snapshot = {
    tiles: placed.tiles,
    ghosts,
    score: snap.score + result.score,
    rng: placed.rng,
    nextId: placed.nextId,
    dir,
  }
  return { ...game, history: [...game.history.slice(0, game.cursor + 1), next], cursor: game.cursor + 1 }
}

export function canUndo(game: Game): boolean {
  return game.cursor > 0
}

export function canRedo(game: Game): boolean {
  return game.cursor < game.history.length - 1
}

export function undo(game: Game): Game {
  return canUndo(game) ? { ...game, cursor: game.cursor - 1 } : game
}

export function redo(game: Game): Game {
  return canRedo(game) ? { ...game, cursor: game.cursor + 1 } : game
}

export function seek(game: Game, index: number): Game {
  const cursor = Math.max(0, Math.min(game.history.length - 1, Math.trunc(index)))
  return cursor === game.cursor ? game : { ...game, cursor }
}

/** Rebuild a game from its seed and move list — the basis of shareable URLs. */
export function replay(seed: number, size: number, moves: readonly Direction[]): Game {
  return moves.reduce((g, dir) => applyMove(g, dir), createGame(seed, size))
}

const DIR_CODE: Record<Direction, string> = { left: 'L', right: 'R', up: 'U', down: 'D' }
const CODE_DIR: Record<string, Direction> = { L: 'left', R: 'right', U: 'up', D: 'down' }

export function encodeMoves(moves: readonly Direction[]): string {
  return moves.map((d) => DIR_CODE[d]).join('')
}

export function decodeMoves(text: string): Direction[] {
  const out: Direction[] = []
  for (const ch of text.toUpperCase()) {
    const dir = CODE_DIR[ch]
    if (dir) out.push(dir)
  }
  return out
}
