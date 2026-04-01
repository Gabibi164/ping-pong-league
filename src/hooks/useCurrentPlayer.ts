'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'ppl_player'

export function useCurrentPlayer() {
  const [currentPlayer, setCurrentPlayerState] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    setCurrentPlayerState(stored)
    setIsLoaded(true)
  }, [])

  const selectPlayer = (name: string) => {
    localStorage.setItem(STORAGE_KEY, name)
    setCurrentPlayerState(name)
  }

  const clearPlayer = () => {
    localStorage.removeItem(STORAGE_KEY)
    setCurrentPlayerState(null)
  }

  return { currentPlayer, isLoaded, selectPlayer, clearPlayer }
}
