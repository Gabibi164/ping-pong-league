'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase, fetchPlayers, fetchMatches, createPlayoffSeries, addPlayoffGame, submitScore } from '@/lib/supabase'
import {
  Player,
  Match,
  PlayoffSeries,
} from '@/lib/types'
import {
  getGroupStandings,
  isGroupStageComplete,
  groupStageProgress,
  buildPlayoffSeries,
} from '@/lib/gameLogic'

export default function PlayoffsPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const load = async () => {
    const [p, m] = await Promise.all([fetchPlayers(), fetchMatches()])
    setPlayers(p)
    setMatches(m)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('playoffs-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const groupDone = isGroupStageComplete(matches)
  const { played, total } = groupStageProgress(matches)

  const standingsA = getGroupStandings('A', players, matches)
  const standingsB = getGroupStandings('B', players, matches)

  const playoffMatches = matches.filter((m) => m.phase !== 'group')
  const hasPlayoffs = playoffMatches.length > 0

  const series = buildPlayoffSeries(matches, players)
  const semi1 = series.find((s) => s.phase === 'semi' && s.player1.group_name === 'A')
  const semi2 = series.find((s) => s.phase === 'semi' && s.player1.group_name === 'B')
  const barrage = series.find((s) => s.phase === 'barrage')
  const final = series.find((s) => s.phase === 'final')

  const generatePlayoffs = async () => {
    if (standingsA.length < 3 || standingsB.length < 3) return
    setCreating(true)
    try {
      // Semi 1: 1st A vs 2nd B
      await createPlayoffSeries('semi', standingsA[0].player.id, standingsB[1].player.id, 2)
      // Semi 2: 1st B vs 2nd A
      await createPlayoffSeries('semi', standingsB[0].player.id, standingsA[1].player.id, 2)
      // Barrage: 3rd A vs 3rd B
      await createPlayoffSeries('barrage', standingsA[2].player.id, standingsB[2].player.id, 2)
      await load()
    } finally {
      setCreating(false)
    }
  }

  const generateFinal = async () => {
    if (!semi1?.winner || !semi2?.winner) return
    setCreating(true)
    try {
      await createPlayoffSeries('final', semi1.winner.id, semi2.winner.id, 3)
      await load()
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500 text-sm">Chargement…</div>
    )
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-black tracking-tight mb-1">Playoffs</h1>

      {!groupDone ? (
        <div className="mt-8 card p-8 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-bold mb-2">Phase de groupes en cours</h2>
          <p className="text-gray-400 text-sm mb-6">
            {played} / {total} matchs de groupe joués — les playoffs démarrent quand tous sont terminés.
          </p>
          <div className="h-2 bg-gray-800 rounded-full max-w-xs mx-auto overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
              style={{ width: `${(played / total) * 100}%` }}
            />
          </div>
        </div>
      ) : !hasPlayoffs ? (
        <div className="mt-8 card p-8 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h2 className="text-xl font-bold mb-2">Prêt pour les playoffs !</h2>
          <p className="text-gray-400 text-sm mb-6">
            Génère le tableau des playoffs en un clic.
          </p>

          {/* Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto mb-8 text-sm">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Demi 1</p>
              <p className="font-bold">{standingsA[0]?.player.name}</p>
              <p className="text-gray-500 text-xs">1er Gr. A</p>
              <p className="text-gray-600 my-1">vs</p>
              <p className="font-bold">{standingsB[1]?.player.name}</p>
              <p className="text-gray-500 text-xs">2e Gr. B</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Demi 2</p>
              <p className="font-bold">{standingsB[0]?.player.name}</p>
              <p className="text-gray-500 text-xs">1er Gr. B</p>
              <p className="text-gray-600 my-1">vs</p>
              <p className="font-bold">{standingsA[1]?.player.name}</p>
              <p className="text-gray-500 text-xs">2e Gr. A</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Barrage</p>
              <p className="font-bold">{standingsA[2]?.player.name}</p>
              <p className="text-gray-500 text-xs">3e Gr. A</p>
              <p className="text-gray-600 my-1">vs</p>
              <p className="font-bold">{standingsB[2]?.player.name}</p>
              <p className="text-gray-500 text-xs">3e Gr. B</p>
            </div>
          </div>

          <button
            onClick={generatePlayoffs}
            disabled={creating}
            className="px-6 py-3 bg-white text-gray-950 rounded-xl font-black text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {creating ? 'Génération…' : '🚀 Générer les playoffs'}
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {/* Semi-finals */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
              Demi-finales · Best-of-3
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[semi1, semi2].map((s, i) => s ? (
                <SeriesCard
                  key={s.series_id}
                  series={s}
                  title={`Demi-finale ${i + 1}`}
                  onRefresh={load}
                />
              ) : (
                <div key={i} className="card p-6 text-center text-gray-600 text-sm">En attente</div>
              ))}
            </div>
          </section>

          {/* Barrage */}
          {barrage && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
                Match de barrage · Best-of-3
              </h2>
              <div className="max-w-sm">
                <SeriesCard series={barrage} title="Barrage" onRefresh={load} />
              </div>
            </section>
          )}

          {/* Final */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
              Finale · Best-of-5
            </h2>
            {final ? (
              <div className="max-w-sm">
                <SeriesCard series={final} title="Finale" onRefresh={load} />
              </div>
            ) : semi1?.is_complete && semi2?.is_complete ? (
              <div className="card p-6 text-center max-w-sm">
                <p className="text-gray-400 text-sm mb-4">
                  Les deux demi-finales sont terminées !
                </p>
                <button
                  onClick={generateFinal}
                  disabled={creating}
                  className="px-5 py-2.5 bg-white text-gray-950 rounded-xl font-black text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Génération…' : '🏆 Générer la finale'}
                </button>
              </div>
            ) : (
              <div className="card p-6 text-center max-w-sm text-gray-600 text-sm">
                En attente de la fin des demi-finales
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

// ── Series card ───────────────────────────────────────────────

function SeriesCard({
  series,
  title,
  onRefresh,
}: {
  series: PlayoffSeries
  title: string
  onRefresh: () => void
}) {
  const [enteringGame, setEnteringGame] = useState<Match | null>(null)
  const [submittingNew, setSubmittingNew] = useState(false)

  const currentGameMatch = series.games.find((g) => !g.is_played)

  const handleAddGame = async () => {
    setSubmittingNew(true)
    try {
      await addPlayoffGame(
        series.series_id,
        series.player1.id,
        series.player2.id,
        series.phase,
        series.max_wins,
        series.games.length + 1
      )
      await onRefresh()
    } finally {
      setSubmittingNew(false)
    }
  }

  const needsNewGame =
    !series.is_complete &&
    !currentGameMatch &&
    series.player1_wins + series.player2_wins < series.max_wins * 2 - 1

  const neededWins = series.max_wins

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</span>
        {series.is_complete && (
          <span className="badge bg-amber-500/20 text-amber-400">🏆 Terminé</span>
        )}
      </div>

      {/* Players + series score */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex-1 text-center">
          <p className={`font-black text-xl ${series.winner === series.player1 ? 'text-amber-400' : 'text-gray-200'}`}>
            {series.player1.name}
          </p>
          <p className="text-xs text-gray-500">{series.player1.group_name && `Gr. ${series.player1.group_name}`}</p>
        </div>
        <div className="text-center px-4">
          <div className="text-3xl font-black tabular-nums">
            <span className={series.player1_wins >= neededWins ? 'text-amber-400' : 'text-white'}>
              {series.player1_wins}
            </span>
            <span className="text-gray-600 mx-1">–</span>
            <span className={series.player2_wins >= neededWins ? 'text-amber-400' : 'text-white'}>
              {series.player2_wins}
            </span>
          </div>
          <p className="text-xs text-gray-600">/{neededWins} victoires</p>
        </div>
        <div className="flex-1 text-center">
          <p className={`font-black text-xl ${series.winner === series.player2 ? 'text-amber-400' : 'text-gray-200'}`}>
            {series.player2.name}
          </p>
          <p className="text-xs text-gray-500">{series.player2.group_name && `Gr. ${series.player2.group_name}`}</p>
        </div>
      </div>

      {/* Individual game results */}
      <div className="flex flex-col gap-1.5 mb-4">
        {series.games.map((g, i) => (
          <div key={g.id} className="flex items-center justify-between text-sm bg-gray-800/40 rounded-lg px-3 py-1.5">
            <span className="text-gray-500 text-xs font-semibold">Game {i + 1}</span>
            {g.is_played ? (
              <span className="font-bold tabular-nums text-gray-300">
                {g.player1_sets} – {g.player2_sets}
              </span>
            ) : (
              <button
                onClick={() => setEnteringGame(g)}
                className="text-xs font-bold text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 px-2.5 py-1 rounded-lg transition-colors"
              >
                Saisir
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add next game */}
      {needsNewGame && (
        <button
          onClick={handleAddGame}
          disabled={submittingNew}
          className="w-full text-xs font-bold text-gray-400 hover:text-white border border-dashed border-gray-700 hover:border-gray-500 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          {submittingNew ? 'Ajout…' : '+ Game suivant'}
        </button>
      )}

      {series.winner && (
        <div className="text-center text-sm font-black text-amber-400 mt-2">
          🏆 {series.winner.name} remporte la série
        </div>
      )}

      {/* Score entry modal for this game */}
      {enteringGame && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setEnteringGame(null)}
        >
          <div
            className="card w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-black mb-4">
              {title} · Game {enteringGame.game_number}
            </h2>
            <GameScoreEntry
              match={enteringGame}
              p1Name={series.player1.name}
              p2Name={series.player2.name}
              onDone={() => { setEnteringGame(null); onRefresh() }}
              onCancel={() => setEnteringGame(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function GameScoreEntry({
  match,
  p1Name,
  p2Name,
  onDone,
  onCancel,
}: {
  match: Match
  p1Name: string
  p2Name: string
  onDone: () => void
  onCancel: () => void
}) {
  const [sel, setSel] = useState<{ p1: number; p2: number } | null>(null)
  const [saving, setSaving] = useState(false)

  const options = [
    { p1: 2, p2: 0, label: `2–0 pour ${p1Name}` },
    { p1: 2, p2: 1, label: `2–1 pour ${p1Name}` },
    { p1: 0, p2: 2, label: `2–0 pour ${p2Name}` },
    { p1: 1, p2: 2, label: `2–1 pour ${p2Name}` },
  ]

  return (
    <div>
      <div className="flex flex-col gap-2 mb-4">
        {options.map((o) => {
          const isSelected = sel?.p1 === o.p1 && sel?.p2 === o.p2
          const winnerIsP1 = o.p1 > o.p2
          return (
            <button
              key={`${o.p1}-${o.p2}`}
              onClick={() => setSel(o)}
              className={`px-4 py-3 rounded-xl border font-semibold text-sm text-left transition-all ${
                isSelected
                  ? winnerIsP1
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-emerald-500 bg-emerald-500/20 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-500'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white font-semibold text-sm"
        >
          Annuler
        </button>
        <button
          disabled={!sel || saving}
          onClick={async () => {
            if (!sel) return
            setSaving(true)
            await submitScore(match.id, sel.p1, sel.p2)
            onDone()
          }}
          className="flex-1 py-2.5 rounded-xl bg-white text-gray-950 font-black text-sm hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Sauvegarde…' : 'Confirmer'}
        </button>
      </div>
    </div>
  )
}
