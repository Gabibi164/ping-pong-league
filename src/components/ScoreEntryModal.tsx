'use client'

import { useState } from 'react'
import { Match } from '@/lib/types'
import { submitScore } from '@/lib/supabase'

interface Props {
  match: Match
  onClose: () => void
  onSuccess: () => void
}

type ScoreOption = { p1: number; p2: number; label: string }

export default function ScoreEntryModal({ match, onClose, onSuccess }: Props) {
  const [selected, setSelected] = useState<ScoreOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const p1Name = match.player1?.name ?? 'Joueur 1'
  const p2Name = match.player2?.name ?? 'Joueur 2'

  const options: ScoreOption[] = [
    { p1: 2, p2: 0, label: `2 – 0 pour ${p1Name}` },
    { p1: 2, p2: 1, label: `2 – 1 pour ${p1Name}` },
    { p1: 0, p2: 2, label: `2 – 0 pour ${p2Name}` },
    { p1: 1, p2: 2, label: `2 – 1 pour ${p2Name}` },
  ]

  const handleConfirm = async () => {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      await submitScore(match.id, selected.p1, selected.p2)
      onSuccess()
    } catch (e) {
      setError('Erreur lors de la sauvegarde. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  const legLabel = match.leg === 1 ? 'Aller' : 'Retour'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
            Saisir le résultat · Groupe {match.group_name} · {legLabel}
          </p>
          <h2 className="text-xl font-black">
            {p1Name}{' '}
            <span className="text-gray-500 font-normal">vs</span> {p2Name}
          </h2>
        </div>

        {/* Score options */}
        <div className="flex flex-col gap-2 mb-5">
          {options.map((opt) => {
            const isWinnerP1 = opt.p1 > opt.p2
            const isSelected =
              selected?.p1 === opt.p1 && selected?.p2 === opt.p2

            return (
              <button
                key={`${opt.p1}-${opt.p2}`}
                onClick={() => setSelected(opt)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border font-semibold text-sm transition-all ${
                  isSelected
                    ? isWinnerP1
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-emerald-500 bg-emerald-500/20 text-white'
                    : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-800'
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`font-black text-base ${
                    isSelected
                      ? isWinnerP1
                        ? 'text-blue-400'
                        : 'text-emerald-400'
                      : 'text-gray-600'
                  }`}
                >
                  {opt.p1} – {opt.p2}
                </span>
              </button>
            )
          })}
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-3 bg-red-400/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 font-semibold text-sm transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || loading}
            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white text-gray-950 hover:bg-gray-200"
          >
            {loading ? 'Sauvegarde…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}
