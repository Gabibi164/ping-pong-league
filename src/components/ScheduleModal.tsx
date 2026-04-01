'use client'

import { useState } from 'react'
import { Match } from '@/lib/types'
import { proposeSlot } from '@/lib/supabase'

interface Props {
  match: Match
  currentPlayerName: string
  onClose: () => void
  onSuccess: () => void
}

export default function ScheduleModal({ match, currentPlayerName, onClose, onSuccess }: Props) {
  const [datetime, setDatetime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const p1Name = match.player1?.name ?? 'Joueur 1'
  const p2Name = match.player2?.name ?? 'Joueur 2'

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!datetime) return
    setLoading(true)
    setError(null)
    try {
      await proposeSlot(match.id, new Date(datetime).toISOString(), currentPlayerName)
      onSuccess()
    } catch {
      setError('Erreur lors de la proposition. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  // Min datetime = now
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  const minDatetime = now.toISOString().slice(0, 16)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
            Proposer un créneau
          </p>
          <h2 className="text-xl font-black">
            {p1Name} <span className="text-gray-500 font-normal">vs</span> {p2Name}
          </h2>
        </div>

        <form onSubmit={handleConfirm} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Date et heure
            </label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              min={minDatetime}
              required
              className="bg-gray-800 border border-gray-700 focus:border-gray-500 outline-none rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 font-semibold text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !datetime}
              className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 bg-white text-gray-950 hover:bg-gray-200"
            >
              {loading ? 'Envoi…' : 'Proposer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
