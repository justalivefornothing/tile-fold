import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import type { Direction } from '../engine/board'
import type { Snapshot } from '../engine/game'
import { Tile } from './Tile'

const SLIDE_MS = 150
const SWIPE_PX = 24

type Track = {
  snapshot: Snapshot
  cursor: number
  travel: 'forward' | 'backward'
  prevIds: ReadonlySet<number>
  settled: boolean
}

type Props = {
  snapshot: Snapshot
  cursor: number
  size: number
  onSwipe: (dir: Direction) => void
  overlay?: ReactNode
}

/**
 * Renders the tray, the tiles of the current snapshot, and — for the first
 * ~150ms after a forward move — the "ghost" tiles that folded into a neighbour
 * so they visibly slide into place before vanishing.
 */
export function Board({ snapshot, cursor, size, onSwipe, overlay }: Props) {
  const [track, setTrack] = useState<Track>({
    snapshot,
    cursor,
    travel: 'forward',
    prevIds: new Set(),
    settled: true,
  })

  // Store information about the previous render so we know which way we travelled.
  if (track.snapshot !== snapshot) {
    setTrack({
      snapshot,
      cursor,
      travel: cursor >= track.cursor ? 'forward' : 'backward',
      prevIds: new Set(track.snapshot.tiles.map((t) => t.id)),
      settled: false,
    })
  }

  useEffect(() => {
    if (track.settled) return
    const timer = setTimeout(() => {
      setTrack((t) => (t.snapshot === snapshot ? { ...t, settled: true } : t))
    }, SLIDE_MS)
    return () => clearTimeout(timer)
  }, [track.settled, snapshot])

  const forward = track.travel === 'forward'
  const ghosts = forward && !track.settled ? snapshot.ghosts : []

  const start = useRef<{ x: number; y: number; id: number } | null>(null)
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current
    start.current = null
    if (!s || s.id !== e.pointerId) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return
    if (Math.abs(dx) > Math.abs(dy)) onSwipe(dx > 0 ? 'right' : 'left')
    else onSwipe(dy > 0 ? 'down' : 'up')
  }

  return (
    <div
      className="board"
      role="group"
      aria-label={`${size} by ${size} board`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (start.current = null)}
    >
      <div className="board-cells" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }} aria-hidden>
        {Array.from({ length: size * size }, (_, i) => (
          <div key={i} className="board-cell" />
        ))}
      </div>
      <div className="tile-layer">
        {/* One keyed array so a tile that becomes a ghost keeps its DOM node (and its slide). */}
        {[
          ...ghosts.map((g) => <Tile key={g.id} tile={g} size={size} ghost />),
          ...snapshot.tiles.map((t) => {
            const entering = !track.prevIds.has(t.id)
            let effect: 'spawned' | 'merged' | 'entering' | undefined
            if (forward && t.spawned) effect = 'spawned'
            else if (forward && t.merged) effect = 'merged'
            else if (entering) effect = 'entering'
            return <Tile key={t.id} tile={t} size={size} effect={effect} />
          }),
        ]}
      </div>
      {overlay}
    </div>
  )
}
