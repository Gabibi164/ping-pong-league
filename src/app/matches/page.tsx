'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase, fetchPlayers, fetchMatches } from '@/lib/supabase'
import { Player, Match } from '@/lib/types'
import { useCurrentPlayer } from '@/hooks/useCurrentPlayer'
import MatchCard from '@/components/MatchCard'
import ScoreEntryModal from '@/components/ScoreEntryModal'
import ScheduleModal from '@/components/ScheduleModal'

type Filter = 'all' | 'mine' | 'A' | 'B'
type StatusFilter = 'all' | 'pending' | 'played'

export default function MatchesPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)
  const [scheduleMatch, setScheduleMatch] = useState<Match | null>(null)
  const { currentPlayer } = useCurrentPlayer()

  const load = async () => {
    const [p, m] = await Promise.all([fetchPlayers(), fetchMatches()])
    setPlayers(p)
    setMatches(m)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('matches-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => load()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const groupMatches = useMemo(
    () => matches.filter((m) => m.phase === 'group'),
    [matches]
  )

  const filtered = useMemo(() => {
    let result = groupMatches
    if (filter === 'mine' && currentPlayer) {
      result = result.filter(
        (m) => m.player1?.name === currentPlayer || m.player2?.name === currentPlayer
      )
    } else if (filter === 'A' || filter === 'B') {
      result = result.filter((m) => m.group_name === filter)
    }
    if (statusFilter === 'pending') result = result.filter((m) => !m.is_played)
    if (statusFilter === 'played') result = result.filter((m) => m.is_played)
    return result
  }, [groupMatches, filter, statusFilter, currentPlayer])

  const pending = groupMatches.filter((m) => !m.is_played).length
  const played = groupMatches.filter((m) => m.is_played).length

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight mb-1">Matchs</h1>
        <p className="text-sm text-gray-500">
          <span className="text-white font-semibold">{pending}</span> à jouer ·{' '}
          <span className="text-green-400 font-semibold">{played}</span> joués
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Group filter */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {([
            { key: 'all', label: 'Tous' },
            { key: 'mine', label: 'Mes matchs' },
            { key: 'A', label: 'Groupe A' },
            { key: 'B', label: 'Groupe B' },
          ] as { key: Filter; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              disabled={key === 'mine' && !currentPlayer}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                filter === key
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {([
            { key: 'all', label: 'Tous' },
            { key: 'pending', label: 'À jouer' },
            { key: 'played', label: 'Joués' },
          ] as { key: StatusFilter; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                statusFilter === key
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Match list */}
      {loading ? (
        <div className="text-center text-gray-500 py-16 text-sm">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-16 text-sm">
          Aucun match trouvé avec ces filtres.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              currentPlayerName={currentPlayer ?? undefined}
              onEnterScore={!match.is_played ? setActiveMatch : undefined}
              onProposeSlot={!match.is_played ? setScheduleMatch : undefined}
              onRefresh={load}
            />
          ))}
        </div>
      )}

      {activeMatch && (
        <ScoreEntryModal
          match={activeMatch}
          onClose={() => setActiveMatch(null)}
          onSuccess={() => { setActiveMatch(null); load() }}
        />
      )}

      {scheduleMatch && currentPlayer && (
        <ScheduleModal
          match={scheduleMatch}
          currentPlayerName={currentPlayer}
          onClose={() => setScheduleMatch(null)}
          onSuccess={() => { setScheduleMatch(null); load() }}
        />
      )}
    </div>
  )
}
