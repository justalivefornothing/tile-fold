import { useEffect, useState, type FormEvent } from 'react'
import { SIZES, type Size } from '../engine/game'
import { seedFromString } from '../engine/rng'

type Props = {
  seed: number
  size: number
  canUndo: boolean
  canRedo: boolean
  onNewGame: (size?: Size, seed?: number) => void
  onUndo: () => void
  onRedo: () => void
}

export function Controls({ seed, size, canUndo, canRedo, onNewGame, onUndo, onRedo }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn btn-primary" onClick={() => onNewGame()}>
        New game
      </button>
      <div className="flex gap-1">
        <button type="button" className="btn" onClick={onUndo} disabled={!canUndo} title="Undo (Z)">
          <span aria-hidden>↶</span> Undo
        </button>
        <button type="button" className="btn" onClick={onRedo} disabled={!canRedo} title="Redo (Y)">
          Redo <span aria-hidden>↷</span>
        </button>
      </div>
      <div className="ml-auto flex gap-1" role="radiogroup" aria-label="Board size">
        {SIZES.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === size}
            className={`btn px-2.5 ${n === size ? 'btn-on' : ''}`}
            onClick={() => n !== size && onNewGame(n)}
            title={`${n}×${n} board`}
          >
            <span className="numerals font-serif text-base leading-none">
              {n}×{n}
            </span>
          </button>
        ))}
      </div>
      <SeedBar key={seed} seed={seed} size={size} onPlay={(s) => onNewGame(size as Size, s)} />
    </div>
  )
}

function SeedBar({ seed, size, onPlay }: { seed: number; size: number; onPlay: (seed: number) => void }) {
  const [text, setText] = useState(String(seed))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    const next = seedFromString(text)
    if (next !== seed) onPlay(next)
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
    } catch {
      window.prompt('Copy this link', window.location.href)
    }
  }

  return (
    <form className="flex w-full items-center gap-2" onSubmit={submit}>
      <label htmlFor="seed" className="text-xs font-medium uppercase tracking-wider text-ink-soft">
        Seed
      </label>
      <input
        id="seed"
        className="field min-w-0 flex-1"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        aria-describedby="seed-help"
      />
      <button type="submit" className="btn" disabled={seedFromString(text) === seed || !text.trim()}>
        Play seed
      </button>
      <button type="button" className="btn" onClick={share} aria-live="polite" title={`Copy a link to this ${size}×${size} game`}>
        {copied ? 'Copied' : 'Copy link'}
      </button>
      <span id="seed-help" className="sr-only">
        Any number or word. The same seed always spawns the same tiles.
      </span>
    </form>
  )
}
