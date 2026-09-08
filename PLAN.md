# Tilefold — Plan

A 2048-style merge-tile puzzle with unlimited undo, seeded deterministic runs,
and a move-by-move replay scrubber.

## Goal

Build a small, polished puzzle game whose engine is a set of pure functions.
Because every board state is an immutable snapshot and every random spawn comes
from a seeded PRNG, undo, redo, replay scrubbing and shareable seed URLs all fall
out of the same data structure with almost no extra logic.

## Features

- 4x4 grid with arrow-key, WASD and touch-swipe input
- Slide-and-merge engine with single-merge-per-move semantics
- Seeded mulberry32 PRNG; `?seed=` in the URL reproduces the spawn sequence
- Unlimited undo/redo via an immutable board history
- Replay scrubber stepping through every move of the current game
- Game-over detection and a 2048 win banner
- Best score persisted to localStorage
- Board-size selector (3x3, 4x4, 5x5) sharing the same engine

## Architecture

```
src/
  engine/
    rng.ts        mulberry32 seeded PRNG (pure, returns next state)
    board.ts      slideRow / move / spawn / isGameOver / hasWon (pure)
    game.ts       Game snapshot type + history reducer (push, undo, redo, seek)
    *.test.ts     vitest specs (exact expected values from the spec)
  hooks/
    useGame.ts    React state around the reducer, keyboard + swipe bindings
    useBestScore.ts localStorage persistence
  components/
    Board.tsx     grid + animated paper tiles
    Tile.tsx      single tile with slide/fold animation
    Scrubber.tsx  replay range input + step buttons
    Controls.tsx  new game / undo / redo / size selector / seed field
  App.tsx         layout and header
```

The core trick: every direction is "slide left" after rotating the grid.
`move(board, dir)` rotates, compresses each row, merges equal neighbours
exactly once left-to-right, re-pads with zeros, rotates back, and reports
`{ board, score, moved }`. If nothing moved, no tile is spawned and the
snapshot history is untouched.

## Milestones

1. Plan, license, git init
2. Vite + React + TS + Tailwind scaffold
3. Pure engine + tests (slideRow, move, isGameOver, seeded determinism)
4. Game reducer with history, hook, keyboard/swipe input, board UI
5. Undo/redo, replay scrubber, seed URL, best score, size selector
6. Kraft-paper visual pass, animations, responsive down to ~380px
7. Build, smoke, screenshot, README, publish
