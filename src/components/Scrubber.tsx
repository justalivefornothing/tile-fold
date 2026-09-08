import type { CSSProperties } from 'react'
import type { Direction } from '../engine/board'

const ARROWS: Record<Direction, string> = { left: '←', right: '→', up: '↑', down: '↓' }

type Props = {
  cursor: number
  length: number
  lastDir: Direction | null
  onSeek: (index: number) => void
  onUndo: () => void
  onRedo: () => void
}

/** Drag through every snapshot of the current game. Undo/redo are the same cursor, one step at a time. */
export function Scrubber({ cursor, length, lastDir, onSeek, onUndo, onRedo }: Props) {
  const last = length - 1
  const empty = last === 0
  const live = cursor === last
  const fill = empty ? 0 : (cursor / last) * 100

  return (
    <section className="card px-3 py-3 sm:px-4" aria-label="Replay">
      <div className="flex items-center gap-2">
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
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Replay position"
          aria-valuetext={`Move ${cursor} of ${last}`}
          style={{ '--fill': `${fill}%` } as CSSProperties}
        />
        <button type="button" className="btn btn-quiet px-2" onClick={onRedo} disabled={live} aria-label="Redo one move" title="Redo (Y)">
          <span aria-hidden>⟩</span>
        </button>
      </div>
      <div className="mt-1 flex items-baseline justify-between px-1 text-xs text-ink-soft">
        {empty ? (
          <span>Make a move and every step lands here — drag to rewind.</span>
        ) : (
          <>
            <span className="numerals font-serif text-sm text-ink">
              Move {cursor}
              <span className="text-ink-soft"> / {last}</span>
              {lastDir && (
                <span className="ml-2 text-ember" aria-label={`last move ${lastDir}`}>
                  {ARROWS[lastDir]}
                </span>
              )}
            </span>
            <span className={live ? '' : 'text-ember font-medium'}>
              {live ? 'Live' : 'Rewound — your next move branches from here'}
            </span>
          </>
        )}
      </div>
    </section>
  )
}
