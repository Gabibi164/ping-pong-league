'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase, fetchPlayers, fetchMatches } from '@/lib/supabase'
import { getGroupStandings, groupStageProgress } from '@/lib/gameLogic'
import { Player, Match } from '@/lib/types'
import { useCurrentPlayer } from '@/hooks/useCurrentPlayer'
import StandingsTable from '@/components/StandingsTable'

export default function StandingsPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
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
      .channel('standings-matches')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => load()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const standingsA = getGroupStandings('A', players, matches)
  const standingsB = getGroupStandings('B', players, matches)
  const { played, total } = groupStageProgress(matches)

  return (
    <div className="py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-1">Classement</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>Phase de groupes</span>
          <span>·</span>
          <span>
            <span className="text-white font-semibold">{played}</span>/{total} matchs joués
          </span>
          {!loading && played === total && total > 0 && (
            <>
              <span>·</span>
              <span className="text-green-400 font-semibold">
                ✓ Phase de groupes terminée !
              </span>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-800 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: total > 0 ? `${(played / total) * 100}%` : '0%' }}
        />
      </div>

      {/* Tables */}
      <div className="flex flex-col gap-6">
        <StandingsTable
          group="A"
          standings={standingsA}
          currentPlayerName={currentPlayer ?? undefined}
          loading={loading}
        />
        <StandingsTable
          group="B"
          standings={standingsB}
          currentPlayerName={currentPlayer ?? undefined}
          loading={loading}
        />
      </div>
    </div>
  )
}
