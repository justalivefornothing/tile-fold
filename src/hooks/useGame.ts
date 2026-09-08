import { useEffect, useMemo, useReducer } from 'react'
import { hasWon, isGameOver, type Direction } from '../engine/board'
import {
  applyMove,
  canRedo,
  canUndo,
  createGame,
  current,
  currentBoard,
  decodeMoves,
  encodeMoves,
  moveList,
  redo,
  replay,
  seek,
  SIZES,
  undo,
  winTarget,
  type Game,
  type Size,
} from '../engine/game'
import { randomSeed, seedFromString } from '../engine/rng'

type State = {
  game: Game
  /** Increments on every new game so the board can reset its animation state. */
  gameId: number
  dismissedWin: boolean
}

type Action =
  | { type: 'move'; dir: Direction }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'seek'; index: number }
  | { type: 'new'; seed?: number; size?: Size }
  | { type: 'dismissWin' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'move': {
      const game = applyMove(state.game, action.dir)
      return game === state.game ? state : { ...state, game }
    }
    case 'undo':
      return { ...state, game: undo(state.game) }
    case 'redo':
      return { ...state, game: redo(state.game) }
    case 'seek':
      return { ...state, game: seek(state.game, action.index) }
    case 'new':
      return {
        game: createGame(action.seed ?? randomSeed(), action.size ?? state.game.size),
        gameId: state.gameId + 1,
        dismissedWin: false,
      }
    case 'dismissWin':
      return { ...state, dismissedWin: true }
  }
}

function isSize(n: number): n is Size {
  return (SIZES as readonly number[]).includes(n)
}

/** Rebuild the game from the URL (`?seed=&size=&m=`) or start a fresh random one. */
function initialState(): State {
  const params = new URLSearchParams(window.location.search)
  const seedParam = params.get('seed')
  const seed = seedParam ? seedFromString(seedParam) : randomSeed()
  const sizeParam = Number(params.get('size'))
  const size: Size = isSize(sizeParam) ? sizeParam : 4
  const moves = decodeMoves(params.get('m') ?? '')
  return { game: replay(seed, size, moves), gameId: 1, dismissedWin: false }
}

const KEY_DIRS: Record<string, Direction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  a: 'left',
  d: 'right',
  w: 'up',
  s: 'down',
  h: 'left',
  l: 'right',
  k: 'up',
  j: 'down',
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const { game, gameId, dismissedWin } = state

  // Keep the address bar in sync so a refresh (or a shared link) reproduces the game.
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('seed', String(game.seed))
    params.set('size', String(game.size))
    const m = encodeMoves(moveList(game))
    if (m) params.set('m', m)
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
  }, [game])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return
      if (e.altKey || e.metaKey) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key

      if (!e.ctrlKey && KEY_DIRS[key]) {
        e.preventDefault()
        dispatch({ type: 'move', dir: KEY_DIRS[key] })
      } else if (key === 'z' && e.shiftKey) {
        e.preventDefault()
        dispatch({ type: 'redo' })
      } else if (key === 'z' || key === 'u' || key === 'Backspace') {
        e.preventDefault()
        dispatch({ type: 'undo' })
      } else if (key === 'y' || key === 'r') {
        e.preventDefault()
        dispatch({ type: 'redo' })
      } else if (key === 'Home') {
        e.preventDefault()
        dispatch({ type: 'seek', index: 0 })
      } else if (key === 'End') {
        e.preventDefault()
        dispatch({ type: 'seek', index: Number.MAX_SAFE_INTEGER })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const snapshot = current(game)
  const board = useMemo(() => currentBoard(game), [game])
  const target = winTarget(game.size)
  const won = hasWon(board, target)
  const over = !won && isGameOver(board)

  // dispatch is stable, so these identities never change — safe to use in effects and timers.
  const actions = useMemo(
    () => ({
      move: (dir: Direction) => dispatch({ type: 'move', dir }),
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
      seek: (index: number) => dispatch({ type: 'seek', index }),
      newGame: (size?: Size, seed?: number) => dispatch({ type: 'new', seed, size }),
      dismissWin: () => dispatch({ type: 'dismissWin' }),
    }),
    [],
  )

  return {
    game,
    gameId,
    snapshot,
    board,
    score: snapshot.score,
    target,
    won,
    showWin: won && !dismissedWin,
    over,
    canUndo: canUndo(game),
    canRedo: canRedo(game),
    ...actions,
  }
}

export type GameApi = ReturnType<typeof useGame>
