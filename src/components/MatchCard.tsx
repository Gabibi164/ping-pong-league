'use client'

import { Match } from '@/lib/types'
import { confirmSlot } from '@/lib/supabase'
import { useState } from 'react'

interface Props {
  match: Match
  currentPlayerName?: string
  onEnterScore?: (match: Match) => void
  onProposeSlot?: (match: Match) => void
  onRefresh?: () => void
  compact?: boolean
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MatchCard({
  match,
  currentPlayerName,
  onEnterScore,
  onProposeSlot,
  onRefresh,
  compact,
}: Props) {
  const p1 = match.player1
  const p2 = match.player2
  const p1Name = p1?.name ?? '?'
  const p2Name = p2?.name ?? '?'
  const [confirming, setConfirming] = useState(false)

  const p1Won = match.is_played && (match.player1_sets ?? 0) > (match.player2_sets ?? 0)
  const p2Won = match.is_played && (match.player2_sets ?? 0) > (match.player1_sets ?? 0)
  const isCurrentInvolved =
    currentPlayerName &&
    (p1Name === currentPlayerName || p2Name === currentPlayerName)

  const phaseLabel =
    match.phase === 'group'
      ? `Groupe ${match.group_name} · ${match.leg === 1 ? 'Aller' : 'Retour'}`
      : match.phase === 'semi'
      ? 'Demi-finale'
      : match.phase === 'barrage'
      ? 'Match de barrage'
      : 'Finale'

  const groupColor =
    match.group_name === 'A'
      ? 'text-blue-400'
      : match.group_name === 'B'
      ? 'text-emerald-400'
      : 'text-purple-400'

  // Scheduling state
  const iProposed = match.scheduled_by === currentPlayerName
  const opponentProposed = match.scheduled_at && !match.schedule_confirmed && !iProposed

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await confirmSlot(match.id)
      onRefresh?.()
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div
      className={`card p-4 flex flex-col gap-3 ${
        isCurrentInvolved ? 'border-gray-600' : ''
      } ${compact ? 'py-3' : ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Phase label */}
        <div className={`hidden sm:block text-xs font-semibold uppercase tracking-wide min-w-[100px] ${groupColor}`}>
          {phaseLabel}
        </div>

        {/* Players + score */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span
            className={`font-bold text-base truncate flex-1 text-right transition-colors ${
              p1Won ? 'text-white' : match.is_played ? 'text-gray-500' : 'text-gray-200'
            } ${p1Name === currentPlayerName ? 'text-white underline underline-offset-2 decoration-dotted' : ''}`}
          >
            {p1Name}
          </span>

          {match.is_played ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xl font-black tabular-nums ${p1Won ? 'text-white' : 'text-gray-500'}`}>
                {match.player1_sets}
              </span>
              <span className="text-gray-600 font-bold">–</span>
              <span className={`text-xl font-black tabular-nums ${p2Won ? 'text-white' : 'text-gray-500'}`}>
                {match.player2_sets}
              </span>
            </div>
          ) : (
            <span className="text-gray-700 font-bold text-lg shrink-0">vs</span>
          )}

          <span
            className={`font-bold text-base truncate flex-1 transition-colors ${
              p2Won ? 'text-white' : match.is_played ? 'text-gray-500' : 'text-gray-200'
            } ${p2Name === currentPlayerName ? 'text-white underline underline-offset-2 decoration-dotted' : ''}`}
          >
            {p2Name}
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {match.is_played ? (
            <span className="badge bg-green-500/20 text-green-400">✓</span>
          ) : onEnterScore ? (
            <button
              onClick={() => onEnterScore(match)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors whitespace-nowrap"
            >
              Saisir
            </button>
          ) : null}
        </div>
      </div>

      {/* Scheduling row */}
      {!match.is_played && (
        <div className="flex items-center gap-2 flex-wrap">
          {!match.scheduled_at && isCurrentInvolved && onProposeSlot && (
            <button
              onClick={() => onProposeSlot(match)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors"
            >
              📅 Proposer un créneau
            </button>
          )}

          {match.scheduled_at && match.schedule_confirmed && (
            <span className="text-xs font-semibold text-emerald-400">
              ✅ {formatDate(match.scheduled_at)}
            </span>
          )}

          {match.scheduled_at && !match.schedule_confirmed && iProposed && (
            <span className="text-xs font-semibold text-gray-500">
              ⏳ En attente — {formatDate(match.scheduled_at)}
            </span>
          )}

          {opponentProposed && isCurrentInvolved && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">
                📅 <span className="font-semibold text-white">{match.scheduled_by}</span> propose{' '}
                <span className="font-semibold text-white">{formatDate(match.scheduled_at!)}</span>
              </span>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                {confirming ? '…' : 'Confirmer'}
              </button>
              {onProposeSlot && (
                <button
                  onClick={() => onProposeSlot(match)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Autre créneau
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
