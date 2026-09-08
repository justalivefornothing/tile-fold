import { useEffect, useState, type CSSProperties } from 'react'
import type { Direction } from '../engine/board'

const ARROWS: Record<Direction, string> = { left: '←', right: '→', up: '↑', down: '↓' }
const STEP_MS = 230

type Props = {
  cursor: number
  length: number
  lastDir: Direction | null
  onSeek: (index: number) => void
  onUndo: () => void
  onRedo: () => void
}

/**
 * Drag through every snapshot of the current game. Undo/redo are the same
 * cursor moved one step at a time; "Play" steps it forward on a timer.
 */
export function Scrubber({ cursor, length, lastDir, onSeek, onUndo, onRedo }: Props) {
  const last = length - 1
  const empty = last === 0
  const live = cursor === last
  const fill = empty ? 0 : (cursor / last) * 100

  const [playing, setPlaying] = useState(false)
  const active = playing && !live

  useEffect(() => {
    if (!active) return
    const id = setInterval(onRedo, STEP_MS)
    return () => clearInterval(id)
  }, [active, onRedo])

  const togglePlay = () => {
    if (active) {
      setPlaying(false)
    } else {
      if (live) onSeek(0)
      setPlaying(true)
    }
  }

  return (
    <section className="card px-3 py-3 sm:px-4" aria-label="Replay">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`btn px-2.5 ${active ? 'btn-on' : ''}`}
          onClick={togglePlay}
          disabled={empty}
          aria-pressed={active}
          aria-label={active ? 'Pause replay' : 'Play replay from the start'}
          title={active ? 'Pause' : 'Replay the game'}
        >
          <span aria-hidden className="inline-block w-3 text-center">
            {active ? '❚❚' : '▶'}
          </span>
        </button>
        <button type="button" className="btn btn-quiet px-2" onClick={onUndo} disabled={cursor === 0} aria-label="Undo one move" title="Undo (Z)">
          <span aria-hidden>⟨</span>
        </button>
        <input
          type="range"
          className="scrub"
          min={0}
          max={Math.max(last, 0)}
          step={1}
          value={cursor}
          disabled={empty}
          onChange={(e) => {
            setPlaying(false)
            onSeek(Number(e.target.value))
          }}
          aria-label="Replay position"
          aria-valuetext={`Move ${cursor} of ${last}`}
          style={{ '--fill': `${fill}%` } as CSSProperties}
        />
        <button type="button" className="btn btn-quiet px-2" onClick={onRedo} disabled={live} aria-label="Redo one move" title="Redo (Y)">
          <span aria-hidden>⟩</span>
        </button>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-3 px-1 text-xs text-ink-soft">
        {empty ? (
          <span>Make a move and every step lands here — drag to rewind, or press play to watch it back.</span>
        ) : (
          <>
            <span className="numerals font-serif text-sm text-ink whitespace-nowrap">
              Move {cursor}
              <span className="text-ink-soft"> / {last}</span>
              {lastDir && (
                <span className="ml-2 text-ember" aria-label={`last move ${lastDir}`}>
                  {ARROWS[lastDir]}
                </span>
              )}
            </span>
            <span className={live ? '' : 'text-right text-ember font-medium'}>
              {live ? 'Live' : active ? 'Replaying…' : 'Rewound — your next move branches from here'}
            </span>
          </>
        )}
      </div>
    </section>
  )
}
