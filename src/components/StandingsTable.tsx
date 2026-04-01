'use client'

import { PlayerStats } from '@/lib/types'

interface Props {
  group: 'A' | 'B'
  standings: PlayerStats[]
  currentPlayerName?: string
  loading?: boolean
}

const RANK_STYLE: Record<number, string> = {
  1: 'text-amber-400 font-black',
  2: 'text-slate-400 font-black',
  3: 'text-orange-600 font-black',
}

const RANK_BG: Record<number, string> = {
  1: 'bg-amber-500/5 border-amber-500/20',
  2: 'bg-slate-400/5 border-slate-400/20',
  3: 'bg-orange-600/5 border-orange-600/20',
}

export default function StandingsTable({
  group,
  standings,
  currentPlayerName,
  loading,
}: Props) {
  const isGroupA = group === 'A'
  const accentColor = isGroupA ? 'blue' : 'emerald'

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className={`px-5 py-3 border-b border-gray-800 flex items-center gap-3 ${
          isGroupA
            ? 'bg-blue-500/10 border-b-blue-500/30'
            : 'bg-emerald-500/10 border-b-emerald-500/30'
        }`}
      >
        <span
          className={`text-xs font-black uppercase tracking-widest ${
            isGroupA ? 'text-blue-400' : 'text-emerald-400'
          }`}
        >
          Groupe {group}
        </span>
        <span className="text-xs text-gray-500">
          Phase de groupes · aller-retour
        </span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500 text-sm">
          Chargement…
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">
                  #
                </th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Joueur
                </th>
                <th className="text-center px-2 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  J
                </th>
                <th className="text-center px-2 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  V
                </th>
                <th className="text-center px-2 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  D
                </th>
                <th className="text-center px-2 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Sets+
                </th>
                <th className="text-center px-2 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Sets-
                </th>
                <th className="text-center px-2 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Diff
                </th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Pts
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => {
                const rank = i + 1
                const isCurrent = s.player.name === currentPlayerName
                const rowBg = RANK_BG[rank] ?? ''
                const isQualified = rank <= 2
                const isBarrage = rank === 3

                return (
                  <tr
                    key={s.player.id}
                    className={`border-b border-gray-800/50 last:border-0 transition-colors ${
                      isCurrent
                        ? `border-l-2 ${isGroupA ? 'border-l-blue-500' : 'border-l-emerald-500'}`
                        : ''
                    } ${rowBg}`}
                  >
                    {/* Rank */}
                    <td className="px-5 py-3">
                      <span className={RANK_STYLE[rank] ?? 'text-gray-500'}>
                        {rank}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${isCurrent ? 'text-white' : 'text-gray-200'}`}
                        >
                          {s.player.name}
                        </span>
                        {s.player.name === 'Louis' && (
                          <span className="badge bg-amber-500/20 text-amber-400">
                            📅 Lun/Mar
                          </span>
                        )}
                        {isQualified && (
                          <span
                            className={`badge hidden lg:inline-flex ${
                              isGroupA
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            Playoffs
                          </span>
                        )}
                        {isBarrage && (
                          <span className="badge hidden lg:inline-flex bg-orange-500/20 text-orange-400">
                            Barrage
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stats */}
                    <td className="px-2 py-3 text-center text-gray-400">
                      {s.played}
                    </td>
                    <td className="px-2 py-3 text-center text-green-400 font-semibold">
                      {s.won}
                    </td>
                    <td className="px-2 py-3 text-center text-red-400">
                      {s.lost}
                    </td>
                    <td className="px-2 py-3 text-center text-gray-400 hidden sm:table-cell">
                      {s.sets_won}
                    </td>
                    <td className="px-2 py-3 text-center text-gray-400 hidden sm:table-cell">
                      {s.sets_lost}
                    </td>
                    <td
                      className={`px-2 py-3 text-center font-semibold hidden sm:table-cell ${
                        s.set_diff > 0
                          ? 'text-green-400'
                          : s.set_diff < 0
                          ? 'text-red-400'
                          : 'text-gray-500'
                      }`}
                    >
                      {s.set_diff > 0 ? '+' : ''}
                      {s.set_diff}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`font-black text-base ${
                          isGroupA ? 'text-blue-400' : 'text-emerald-400'
                        }`}
                      >
                        {s.points}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="px-5 py-2.5 border-t border-gray-800/50 flex flex-wrap gap-4 text-xs text-gray-500">
        <span>
          <span className="text-green-400 font-bold mr-1">1er–2e</span>→
          Demi-finales
        </span>
        <span>
          <span className="text-orange-400 font-bold mr-1">3e</span>→ Match de
          barrage
        </span>
        <span className="hidden sm:inline">
          Bonus +1 pt si victoire 2-0
        </span>
      </div>
    </div>
  )
}
