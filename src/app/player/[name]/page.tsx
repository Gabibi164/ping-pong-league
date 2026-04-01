'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, fetchPlayers, fetchMatches } from '@/lib/supabase'
import { Player, Match } from '@/lib/types'
import { getGroupStandings } from '@/lib/gameLogic'
import { useCurrentPlayer } from '@/hooks/useCurrentPlayer'
import MatchCard from '@/components/MatchCard'
import ScoreEntryModal from '@/components/ScoreEntryModal'

export default function PlayerPage() {
  const params = useParams()
  const router = useRouter()
  const rawName = params.name as string
  const playerName = decodeURIComponent(rawName)

  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)
  const { currentPlayer, selectPlayer } = useCurrentPlayer()

  const load = async () => {
    const [p, m] = await Promise.all([fetchPlayers(), fetchMatches()])
    setPlayers(p)
    setMatches(m)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`player-${playerName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [playerName])

  const player = players.find((p) => p.name === playerName)

  if (!loading && !player) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400">Joueur &quot;{playerName}&quot; introuvable.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-sm text-blue-400 hover:underline"
        >
          Retour à l&apos;accueil
        </button>
      </div>
    )
  }

  const groupMatches = matches.filter((m) => m.phase === 'group')
  const myMatches = groupMatches.filter(
    (m) => m.player1?.name === playerName || m.player2?.name === playerName
  )
  const myPlayed = myMatches.filter((m) => m.is_played)
  const myPending = myMatches.filter((m) => !m.is_played)

  // Calculate personal stats
  let wins = 0, losses = 0, points = 0, setsFor = 0, setsAgainst = 0
  for (const m of myPlayed) {
    const isP1 = m.player1?.name === playerName
    const myS = isP1 ? (m.player1_sets ?? 0) : (m.player2_sets ?? 0)
    const oppS = isP1 ? (m.player2_sets ?? 0) : (m.player1_sets ?? 0)
    setsFor += myS
    setsAgainst += oppS
    if (myS > oppS) {
      wins++
      points += 3
      if (myS === 2 && oppS === 0) points += 1 // bonus
    } else {
      losses++
    }
  }

  // Rank in group
  const groupStandings = player
    ? getGroupStandings(player.group_name, players, matches)
    : []
  const rank = groupStandings.findIndex((s) => s.player.name === playerName) + 1
  const rankSuffix = rank === 1 ? 'er' : 'e'

  const isCurrentUser = currentPlayer === playerName
  const groupColor = player?.group_name === 'A' ? 'blue' : 'emerald'

  return (
    <div className="py-8">
      {/* Profile header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${
                groupColor === 'blue'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {playerName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-black">{playerName}</h1>
              </div>
              <p
                className={`text-sm font-semibold mt-0.5 ${
                  groupColor === 'blue' ? 'text-blue-400' : 'text-emerald-400'
                }`}
              >
                Groupe {player?.group_name} ·{' '}
                {!loading && rank > 0
                  ? `${rank}${rankSuffix} au classement`
                  : 'Chargement…'}
              </p>
            </div>
          </div>

          {!isCurrentUser && (
            <button
              onClick={() => {
                selectPlayer(playerName)
              }}
              className="text-xs font-bold px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 hover:text-white transition-colors whitespace-nowrap"
            >
              C&apos;est moi
            </button>
          )}
          {isCurrentUser && (
            <span className="badge bg-green-500/20 text-green-400 self-start">
              ✓ Mon profil
            </span>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Points', value: points, color: groupColor === 'blue' ? 'text-blue-400' : 'text-emerald-400' },
            { label: 'Victoires', value: wins, color: 'text-green-400' },
            { label: 'Défaites', value: losses, color: 'text-red-400' },
            { label: 'Joués', value: myPlayed.length, color: 'text-gray-300' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-800/50 rounded-xl p-3 text-center">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Sets */}
        {myPlayed.length > 0 && (
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <span>
              Sets : <span className="text-white font-semibold">{setsFor}</span> pour
              · <span className="text-white font-semibold">{setsAgainst}</span> contre
            </span>
            <span>
              Diff :{' '}
              <span
                className={`font-semibold ${
                  setsFor - setsAgainst > 0
                    ? 'text-green-400'
                    : setsFor - setsAgainst < 0
                    ? 'text-red-400'
                    : 'text-gray-400'
                }`}
              >
                {setsFor - setsAgainst > 0 ? '+' : ''}
                {setsFor - setsAgainst}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Pending matches */}
      <section className="mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-3">
          Matchs à jouer ({myPending.length})
        </h2>
        {myPending.length === 0 ? (
          <div className="card p-5 text-center text-gray-600 text-sm">
            {myPlayed.length === myMatches.length && myMatches.length > 0
              ? '✓ Tous les matchs de groupe sont joués !'
              : 'Aucun match en attente'}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {myPending.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                currentPlayerName={playerName}
                onEnterScore={setActiveMatch}
              />
            ))}
          </div>
        )}
      </section>

      {/* Played matches */}
      {myPlayed.length > 0 && (
        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-3">
            Résultats ({myPlayed.length})
          </h2>
          <div className="flex flex-col gap-2">
            {myPlayed.map((m) => {
              const isP1 = m.player1?.name === playerName
              const myS = isP1 ? m.player1_sets : m.player2_sets
              const oppS = isP1 ? m.player2_sets : m.player1_sets
              const won = (myS ?? 0) > (oppS ?? 0)
              return (
                <div key={m.id} className="relative">
                  <MatchCard match={m} currentPlayerName={playerName} compact />
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                      won ? 'bg-green-500' : 'bg-red-500/60'
                    }`}
                  />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {activeMatch && (
        <ScoreEntryModal
          match={activeMatch}
          onClose={() => setActiveMatch(null)}
          onSuccess={() => { setActiveMatch(null); load() }}
        />
      )}
    </div>
  )
}
