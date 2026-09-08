import { useEffect, useState } from 'react'

function read(key: string): number {
  try {
    return Number(window.localStorage.getItem(key)) || 0
  } catch {
    return 0
  }
}

/** Best score per board size, persisted to localStorage. */
export function useBestScore(size: number, score: number): number {
  const key = `tilefold.best.${size}`
  const [best, setBest] = useState(() => read(key))

  useEffect(() => {
    setBest(read(key))
  }, [key])

  useEffect(() => {
    if (score <= best) return
    setBest(score)
    try {
      window.localStorage.setItem(key, String(score))
    } catch {
      /* private mode or quota — best score simply lives in memory */
    }
  }, [score, best, key])

  return Math.max(best, score)
}
