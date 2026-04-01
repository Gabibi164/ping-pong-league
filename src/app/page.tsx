'use client'
export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCurrentPlayer } from '@/hooks/useCurrentPlayer'
import { fetchPlayers, registerPlayer } from '@/lib/supabase'
import type { Player } from '@/lib/types'

export default function HomePage() {
  const router = useRouter()
  const { selectPlayer, currentPlayer } = useCurrentPlayer()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEntreprise, setNewEntreprise] = useState('')
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPlayers = async () => {
    try {
      const data = await fetchPlayers()
      setPlayers(data as Player[])
    } catch {
      setError('Impossible de charger les joueurs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlayers()
  }, [])

  const handleSelect = (name: string) => {
    const player = players.find((p) => p.name === name)
    selectPlayer(name, player?.entreprise)
    router.push(`/player/${encodeURIComponent(name)}`)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setRegistering(true)
    setError(null)
    try {
      await registerPlayer(newName, newEntreprise)
      setNewName('')
      setNewEntreprise('')
      setShowRegister(false)
      await loadPlayers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'inscription.'
      setError(msg)
    } finally {
      setRegistering(false)
    }
  }

  const groupA = players.filter((p) => p.group_name === 'A')
  const groupB = players.filter((p) => p.group_name === 'B')

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-12">
      {/* Hero */}
      <div className="text-center mb-14">
        <div className="text-6xl mb-4">🏓</div>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-3 leading-none">
          WOJO
          <br />
          PING PONG
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            LEAGUE
          </span>
        </h1>
        <p className="text-gray-400 text-lg mt-4">
          Clique sur ton nom pour accéder à ton profil.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement des joueurs…</p>
      ) : (
        <>
          {/* Player grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
            {/* Group A */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-0.5 flex-1 bg-blue-500/30" />
                <span className="text-xs font-black uppercase tracking-widest text-blue-400 px-2">
                  Groupe A
                </span>
                <div className="h-0.5 flex-1 bg-blue-500/30" />
              </div>
              <div className="flex flex-col gap-2">
                {groupA.length === 0 && (
                  <p className="text-gray-600 text-sm text-center py-4">Aucun joueur</p>
                )}
                {groupA.map((p) => (
                  <PlayerButton
                    key={p.id}
                    name={p.name}
                    entreprise={p.entreprise}
                    isActive={currentPlayer === p.name}
                    group="A"
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>

            {/* Group B */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-0.5 flex-1 bg-emerald-500/30" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400 px-2">
                  Groupe B
                </span>
                <div className="h-0.5 flex-1 bg-emerald-500/30" />
              </div>
              <div className="flex flex-col gap-2">
                {groupB.length === 0 && (
                  <p className="text-gray-600 text-sm text-center py-4">Aucun joueur</p>
                )}
                {groupB.map((p) => (
                  <PlayerButton
                    key={p.id}
                    name={p.name}
                    entreprise={p.entreprise}
                    isActive={currentPlayer === p.name}
                    group="B"
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Register section */}
          <div className="mt-10 w-full max-w-2xl">
            {!showRegister ? (
              <button
                onClick={() => setShowRegister(true)}
                className="w-full border border-dashed border-gray-700 hover:border-gray-500 text-gray-500 hover:text-gray-300 rounded-xl py-3 text-sm font-semibold transition-all"
              >
                + S'inscrire
              </button>
            ) : (
              <form
                onSubmit={handleRegister}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4"
              >
                <h2 className="text-base font-black text-white">S'inscrire à la ligue</h2>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ton prénom"
                    maxLength={40}
                    required
                    className="bg-gray-800 border border-gray-700 focus:border-gray-500 outline-none rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    Entreprise
                  </label>
                  <input
                    type="text"
                    value={newEntreprise}
                    onChange={(e) => setNewEntreprise(e.target.value)}
                    placeholder="Ton entreprise"
                    maxLength={60}
                    className="bg-gray-800 border border-gray-700 focus:border-gray-500 outline-none rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={registering || !newName.trim()}
                    className="flex-1 bg-white text-gray-950 font-black rounded-lg py-2 text-sm hover:bg-gray-200 disabled:opacity-50 transition-all"
                  >
                    {registering ? 'Inscription…' : 'S\'inscrire'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowRegister(false); setError(null) }}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}

      {/* Quick nav */}
      <div className="mt-14 flex flex-wrap justify-center gap-3">
        {[
          { href: '/standings', label: '📊 Classement', sub: 'Voir les tableaux' },
          { href: '/matches', label: '⚡ Matchs', sub: 'Saisir des résultats' },
          { href: '/playoffs', label: '🏆 Playoffs', sub: 'Bracket final' },
        ].map(({ href, label, sub }) => (
          <a
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-600 rounded-xl px-5 py-3 transition-all"
          >
            <span className="font-bold text-sm text-gray-200">{label}</span>
            <span className="text-xs text-gray-500">{sub}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

function PlayerButton({
  name,
  entreprise,
  group,
  isActive,
  onSelect,
}: {
  name: string
  entreprise?: string | null
  group: 'A' | 'B'
  isActive: boolean
  onSelect: (name: string) => void
}) {
  const activeStyle =
    group === 'A'
      ? 'border-blue-500 bg-blue-500/15 text-white'
      : 'border-emerald-500 bg-emerald-500/15 text-white'

  return (
    <button
      onClick={() => onSelect(name)}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] ${
        isActive ? activeStyle : 'border-gray-800 bg-gray-900 hover:border-gray-600 hover:bg-gray-800'
      }`}
    >
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
          isActive
            ? group === 'A'
              ? 'bg-blue-500 text-white'
              : 'bg-emerald-500 text-white'
            : 'bg-gray-800 text-gray-400'
        }`}
      >
        {name[0]}
      </span>
      <div className="flex flex-col items-start">
        <span>{name}</span>
        {entreprise && <span className="text-xs font-normal text-gray-400">{entreprise}</span>}
      </div>
    </button>
  )
}
