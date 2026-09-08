import type { CSSProperties } from 'react'
import type { Tile as TileData } from '../engine/game'

type Palette = { bg: string; ink: string; hot?: boolean }

const PALETTE: Record<number, Palette> = {
  2: { bg: '#f6ecd8', ink: '#5b4636' },
  4: { bg: '#f0dfbe', ink: '#5b4636' },
  8: { bg: '#f2bd86', ink: '#5b3a24' },
  16: { bg: '#eca263', ink: '#fbf3e4' },
  32: { bg: '#e6874d', ink: '#fbf3e4' },
  64: { bg: '#d96a3c', ink: '#fbf3e4', hot: true },
  128: { bg: '#cc5832', ink: '#fbf3e4', hot: true },
  256: { bg: '#c04a2a', ink: '#fbf3e4', hot: true },
  512: { bg: '#b03e23', ink: '#fbf3e4', hot: true },
  1024: { bg: '#9c341d', ink: '#fbf3e4', hot: true },
  2048: { bg: '#7f2a18', ink: '#ffe6a8', hot: true },
}
const BEYOND: Palette = { bg: '#3b2c20', ink: '#ffe6a8', hot: true }

function paletteFor(value: number): Palette {
  return PALETTE[value] ?? BEYOND
}

/** Deterministic paper tilt per tile so the same tile always leans the same way. */
function tiltFor(id: number): string {
  const steps = [-2.2, 1.6, -0.8, 2.4, -1.4, 0.9, -2.6, 1.2]
  return `${steps[id % steps.length]}deg`
}

type Props = {
  tile: TileData
  size: number
  ghost?: boolean
  /** Which one-shot animation to run when this tile appears in the current snapshot. */
  effect?: 'spawned' | 'merged' | 'entering'
}

export function Tile({ tile, size, ghost = false, effect }: Props) {
  const palette = paletteFor(tile.value)
  const digits = String(tile.value).length
  const scale = digits <= 2 ? 0.44 : digits === 3 ? 0.38 : digits === 4 ? 0.31 : 0.26
  const style = {
    '--r': tile.r,
    '--c': tile.c,
    '--n': size,
    '--tilt': tiltFor(tile.id),
    '--tile-bg': palette.bg,
    '--tile-ink': palette.ink,
    fontSize: `calc(${(100 / size) * scale}cqw)`,
  } as CSSProperties

  const classes = ['slot', ghost ? 'ghost' : '', effect ?? ''].filter(Boolean).join(' ')

  return (
    <div className={classes} style={style} aria-hidden={ghost}>
      <div className={`paper numerals${palette.hot ? ' hot' : ''}`}>{tile.value}</div>
    </div>
  )
}
