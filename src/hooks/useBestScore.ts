import { useEffect } from 'react'

function read(key: string): number {
  try {
    return Number(window.localStorage.getItem(key)) || 0
  } catch {
    return 0
  }
}

/** Best score per board size, persisted to localStorage. Derived during render; the effect only writes. */
export function useBestScore(size: number, score: number): number {
  const key = `tilefold.best.${size}`
  const stored = read(key)
  const best = Math.max(stored, score)

  useEffect(() => {
    if (score <= stored) return
    try {
      window.localStorage.setItem(key, String(score))
    } catch {
      /* private mode or quota exceeded — the best score simply lives in memory */
    }
  }, [key, score, stored])

  return best
}
