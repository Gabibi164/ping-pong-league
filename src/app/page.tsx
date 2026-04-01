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
      <div className="text-center mb-12">
        <div className="mb-6">
          <img src="/logo.png" alt="Wojo" className="w-28 h-28 mx-auto rounded-3xl shadow-2xl shadow-[#3BBCD0]/20" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2 leading-none">
          PING PONG
          <br />
          <span className="wojo-text">LEAGUE</span>
        </h1>
        <p className="text-gray-500 text-sm mt-3 tracking-wide uppercase font-semibold">
          Clique sur ton nom pour accéder à ton profil
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
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-black uppercase tracking-widest text-[#3BBCD0]">
                  Groupe A
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-[#3BBCD0]/30 to-transparent" />
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
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-black uppercase tracking-widest text-[#3BBCD0]">
                  Groupe B
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-[#3BBCD0]/30 to-transparent" />
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
                className="w-full border border-dashed border-white/10 hover:border-[#3BBCD0]/40 text-gray-600 hover:text-[#3BBCD0] rounded-2xl py-3.5 text-sm font-semibold transition-all"
              >
                + S'inscrire à la ligue
              </button>
            ) : (
              <form
                onSubmit={handleRegister}
                className="card p-5 flex flex-col gap-4"
              >
                <h2 className="text-base font-black text-white">S'inscrire à la ligue</h2>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ton prénom"
                    maxLength={40}
                    required
                    className="bg-white/[0.05] border border-white/10 focus:border-[#3BBCD0]/50 outline-none rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-gray-600"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    Entreprise
                  </label>
                  <input
                    type="text"
                    value={newEntreprise}
                    onChange={(e) => setNewEntreprise(e.target.value)}
                    placeholder="Ton entreprise"
                    maxLength={60}
                    required
                    className="bg-white/[0.05] border border-white/10 focus:border-[#3BBCD0]/50 outline-none rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-gray-600"
                  />
                </div>

                {error && <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={registering || !newName.trim() || !newEntreprise.trim()}
                    className="flex-1 wojo-gradient text-black font-black rounded-xl py-2.5 text-sm disabled:opacity-40 transition-all hover:opacity-90"
                  >
                    {registering ? 'Inscription…' : 'S\'inscrire'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowRegister(false); setError(null) }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-300 transition-colors"
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
      <div className="mt-10 flex flex-wrap justify-center gap-2 w-full max-w-2xl">
        {[
          { href: '/standings', label: 'Classement', icon: '📊', sub: 'Voir les groupes' },
          { href: '/matches', label: 'Matchs', icon: '⚡', sub: 'Résultats & créneaux' },
          { href: '/playoffs', label: 'Playoffs', icon: '🏆', sub: 'Bracket final' },
        ].map(({ href, label, icon, sub }) => (
          <a
            key={href}
            href={href}
            className="flex-1 min-w-[100px] flex flex-col items-center gap-1 glass-btn rounded-2xl px-4 py-3.5 transition-all"
          >
            <span className="text-xl">{icon}</span>
            <span className="font-bold text-sm text-white">{label}</span>
            <span className="text-xs text-gray-600">{sub}</span>
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
  return (
    <button
      onClick={() => onSelect(name)}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border font-bold text-base transition-all hover:scale-[1.01] active:scale-[0.99] ${
        isActive
          ? 'border-[#3BBCD0]/50 bg-[#3BBCD0]/10 text-white'
          : 'border-white/[0.07] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06] text-gray-200'
      }`}
    >
      <span
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
          isActive ? 'wojo-gradient text-black' : 'bg-white/[0.08] text-gray-400'
        }`}
      >
        {name[0]}
      </span>
      <div className="flex flex-col items-start">
        <span className="text-sm font-bold">{name}</span>
        {entreprise && <span className="text-xs font-normal text-gray-500">{entreprise}</span>}
      </div>
      {isActive && <span className="ml-auto text-[#3BBCD0] text-xs font-bold">✓</span>}
    </button>
  )
}
