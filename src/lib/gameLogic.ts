import { Match, Player, PlayerStats, PlayoffSeries } from './types'

// ── Standings ────────────────────────────────────────────────

export function calculateStandings(
  players: Player[],
  matches: Match[]
): PlayerStats[] {
  const stats: Record<string, PlayerStats> = {}

  for (const player of players) {
    stats[player.id] = {
      player,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      sets_won: 0,
      sets_lost: 0,
      set_diff: 0,
    }
  }

  for (const m of matches) {
    if (
      !m.is_played ||
      m.player1_sets === null ||
      m.player2_sets === null ||
      m.phase !== 'group'
    )
      continue

    const p1 = stats[m.player1_id]
    const p2 = stats[m.player2_id]
    if (!p1 || !p2) continue

    p1.played++
    p2.played++
    p1.sets_won += m.player1_sets
    p1.sets_lost += m.player2_sets
    p2.sets_won += m.player2_sets
    p2.sets_lost += m.player1_sets

    if (m.player1_sets > m.player2_sets) {
      // Player 1 wins
      p1.won++
      p2.lost++
      p1.points += 3
      if (m.player1_sets === 2 && m.player2_sets === 0) p1.points += 1 // 2-0 bonus
    } else {
      // Player 2 wins
      p2.won++
      p1.lost++
      p2.points += 3
      if (m.player2_sets === 2 && m.player1_sets === 0) p2.points += 1 // 2-0 bonus
    }
  }

  const result = Object.values(stats)
  result.forEach((s) => (s.set_diff = s.sets_won - s.sets_lost))

  result.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.set_diff !== a.set_diff) return b.set_diff - a.set_diff
    return b.sets_won - a.sets_won
  })

  result.forEach((s, i) => (s.rank = i + 1))
  return result
}

export function getGroupStandings(
  group: 'A' | 'B',
  players: Player[],
  matches: Match[]
): PlayerStats[] {
  const groupPlayers = players.filter((p) => p.group_name === group)
  const groupMatches = matches.filter(
    (m) => m.phase === 'group' && m.group_name === group
  )
  return calculateStandings(groupPlayers, groupMatches)
}

// ── Group stage completion ───────────────────────────────────

export function isGroupStageComplete(matches: Match[]): boolean {
  const groupMatches = matches.filter((m) => m.phase === 'group')
  return groupMatches.length > 0 && groupMatches.every((m) => m.is_played)
}

export function groupStageProgress(matches: Match[]) {
  const group = matches.filter((m) => m.phase === 'group')
  const played = group.filter((m) => m.is_played).length
  return { played, total: group.length }
}

// ── Playoff series helpers ───────────────────────────────────

export function buildPlayoffSeries(
  matches: Match[],
  players: Player[]
): PlayoffSeries[] {
  const playerMap: Record<string, Player> = {}
  players.forEach((p) => (playerMap[p.id] = p))

  const playoffMatches = matches.filter(
    (m) => m.phase !== 'group' && m.series_id
  )
  const bySeriesId: Record<string, Match[]> = {}
  for (const m of playoffMatches) {
    if (!m.series_id) continue
    if (!bySeriesId[m.series_id]) bySeriesId[m.series_id] = []
    bySeriesId[m.series_id].push(m)
  }

  const series: PlayoffSeries[] = []
  for (const [seriesId, games] of Object.entries(bySeriesId)) {
    games.sort((a, b) => a.game_number - b.game_number)
    const first = games[0]
    const p1 = playerMap[first.player1_id]
    const p2 = playerMap[first.player2_id]
    if (!p1 || !p2) continue

    let p1Wins = 0
    let p2Wins = 0
    for (const g of games) {
      if (!g.is_played || g.player1_sets === null || g.player2_sets === null)
        continue
      if (g.player1_sets > g.player2_sets) p1Wins++
      else p2Wins++
    }

    const maxWins = first.max_wins ?? 2
    const winner =
      p1Wins >= maxWins ? p1 : p2Wins >= maxWins ? p2 : undefined

    series.push({
      series_id: seriesId,
      phase: first.phase,
      player1: p1,
      player2: p2,
      player1_wins: p1Wins,
      player2_wins: p2Wins,
      max_wins: maxWins,
      games,
      winner,
      is_complete: !!winner,
    })
  }

  return series
}

// ── Validation ───────────────────────────────────────────────

export function isValidGroupScore(p1: number, p2: number): boolean {
  const validCombos = [
    [2, 0],
    [0, 2],
    [2, 1],
    [1, 2],
  ]
  return validCombos.some(([a, b]) => a === p1 && b === p2)
}

