import { Board } from './components/Board'
import { Controls } from './components/Controls'
import { Overlay } from './components/Overlay'
import { ScoreCard } from './components/ScoreCard'
import { Scrubber } from './components/Scrubber'
import { useBestScore } from './hooks/useBestScore'
import { useGame } from './hooks/useGame'

export default function App() {
  const g = useGame()
  const best = useBestScore(g.game.size, g.score)

  const overlay = g.showWin ? (
    <Overlay
      title={`${g.target.toLocaleString()}, folded.`}
      body={`You reached ${g.target.toLocaleString()} in ${g.game.cursor} moves. Keep stacking or start fresh.`}
      primary={{ label: 'Keep going', onClick: g.dismissWin }}
      secondary={{ label: 'New game', onClick: () => g.newGame() }}
    />
  ) : g.over ? (
    <Overlay
      title="Out of moves"
      body={`Score ${g.score.toLocaleString()} after ${g.game.cursor} moves. Undo to try a different line, or deal a new board.`}
      primary={{ label: 'New game', onClick: () => g.newGame() }}
      secondary={g.canUndo ? { label: 'Undo', onClick: g.undo } : undefined}
    />
  ) : null

  return (
    <div className="min-h-screen px-4 py-6 sm:py-10">
      <main className="mx-auto flex w-full max-w-[520px] flex-col gap-4">
        <header>
          <div className="flex items-end justify-between gap-4">
            <h1 className="font-serif text-5xl leading-none tracking-tight text-ink" style={{ fontVariationSettings: "'opsz' 144" }}>
              Tilefold
            </h1>
            <div className="flex gap-2">
              <ScoreCard label="Score" value={g.score} tilt="-1.5deg" />
              <ScoreCard label="Best" value={best} tilt="1deg" />
            </div>
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            Slide tiles, fold pairs, reach{' '}
            <span className="numerals font-serif text-base text-ember">{g.target.toLocaleString()}</span>. Undo anything, replay
            everything.
          </p>
        </header>

        <Controls
          seed={g.game.seed}
          size={g.game.size}
          canUndo={g.canUndo}
          canRedo={g.canRedo}
          onNewGame={g.newGame}
          onUndo={g.undo}
          onRedo={g.redo}
        />

        <Board key={g.gameId} snapshot={g.snapshot} cursor={g.game.cursor} size={g.game.size} onSwipe={g.move} overlay={overlay} />

        <Scrubber
          cursor={g.game.cursor}
          length={g.game.history.length}
          lastDir={g.snapshot.dir}
          onSeek={g.seek}
          onUndo={g.undo}
          onRedo={g.redo}
        />

        <footer className="px-1 text-xs leading-relaxed text-ink-soft">
          <span className="font-medium text-ink">Keys</span> arrows or WASD to slide · Z undo · Y redo · Home / End to jump. Swipe on
          touch. Seed <span className="numerals font-serif text-sm text-ink">{g.game.seed}</span> always deals the same tiles, and the
          link carries your moves.
        </footer>
      </main>
    </div>
  )
}
