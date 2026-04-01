'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'ppl_player'
const STORAGE_ENTREPRISE_KEY = 'ppl_entreprise'

export function useCurrentPlayer() {
  const [currentPlayer, setCurrentPlayerState] = useState<string | null>(null)
  const [currentEntreprise, setCurrentEntrepriseState] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const storedEntreprise = localStorage.getItem(STORAGE_ENTREPRISE_KEY)
    setCurrentPlayerState(stored)
    setCurrentEntrepriseState(storedEntreprise)
    setIsLoaded(true)
  }, [])

  const selectPlayer = (name: string, entreprise?: string | null) => {
    localStorage.setItem(STORAGE_KEY, name)
    setCurrentPlayerState(name)
    if (entreprise) {
      localStorage.setItem(STORAGE_ENTREPRISE_KEY, entreprise)
      setCurrentEntrepriseState(entreprise)
    } else {
      localStorage.removeItem(STORAGE_ENTREPRISE_KEY)
      setCurrentEntrepriseState(null)
    }
  }

  const clearPlayer = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_ENTREPRISE_KEY)
    setCurrentPlayerState(null)
    setCurrentEntrepriseState(null)
  }

  return { currentPlayer, currentEntreprise, isLoaded, selectPlayer, clearPlayer }
}
