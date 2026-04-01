import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Fetch all players with their group info
export async function fetchPlayers() {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('group_name')
    .order('name')
  if (error) throw error
  return data
}

// Fetch all matches with player info joined
export async function fetchMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      player1:player1_id ( id, name, group_name ),
      player2:player2_id ( id, name, group_name )
    `)
    .order('created_at')
  if (error) throw error
  return data
}

// Submit a group-stage score
export async function submitScore(
  matchId: string,
  player1Sets: number,
  player2Sets: number
) {
  const { error } = await supabase
    .from('matches')
    .update({
      player1_sets: player1Sets,
      player2_sets: player2Sets,
      is_played: true,
      played_at: new Date().toISOString(),
    })
    .eq('id', matchId)
  if (error) throw error
}

// Create a new playoff series (first game)
export async function createPlayoffSeries(
  phase: 'semi' | 'barrage' | 'final',
  player1Id: string,
  player2Id: string,
  maxWins: number
) {
  const seriesId = crypto.randomUUID()
  const { error } = await supabase.from('matches').insert({
    player1_id: player1Id,
    player2_id: player2Id,
    phase,
    series_id: seriesId,
    game_number: 1,
    max_wins: maxWins,
    leg: 1,
  })
  if (error) throw error
  return seriesId
}

// Register a new player — group is auto-assigned to keep groups balanced,
// then matches are generated against all existing players in the same group
export async function registerPlayer(name: string, entreprise: string) {
  const { data: existing, error: fetchError } = await supabase
    .from('players')
    .select('id, group_name')
  if (fetchError) throw fetchError

  const countA = existing?.filter((p) => p.group_name === 'A').length ?? 0
  const countB = existing?.filter((p) => p.group_name === 'B').length ?? 0

  let group: 'A' | 'B'
  if (countA < countB) group = 'A'
  else if (countB < countA) group = 'B'
  else group = Math.random() < 0.5 ? 'A' : 'B'

  const { data: newPlayer, error } = await supabase
    .from('players')
    .insert({ name: name.trim(), group_name: group, entreprise: entreprise.trim() || null })
    .select()
    .single()
  if (error) throw error

  const groupmates = existing?.filter((p) => p.group_name === group) ?? []
  if (groupmates.length > 0) {
    const matches = groupmates.map((p) => ({
      player1_id: newPlayer.id,
      player2_id: p.id,
      phase: 'group',
      group_name: group,
      leg: 1,
      game_number: 1,
    }))
    const { error: matchError } = await supabase.from('matches').insert(matches)
    if (matchError) throw matchError
  }

  return newPlayer
}

// Propose a match slot
export async function proposeSlot(matchId: string, scheduledAt: string, playerName: string) {
  const { error } = await supabase
    .from('matches')
    .update({ scheduled_at: scheduledAt, scheduled_by: playerName, schedule_confirmed: false })
    .eq('id', matchId)
  if (error) throw error
}

// Confirm a proposed slot
export async function confirmSlot(matchId: string) {
  const { error } = await supabase
    .from('matches')
    .update({ schedule_confirmed: true })
    .eq('id', matchId)
  if (error) throw error
}

// Add next game in a playoff series
export async function addPlayoffGame(
  seriesId: string,
  player1Id: string,
  player2Id: string,
  phase: string,
  maxWins: number,
  gameNumber: number
) {
  const { error } = await supabase.from('matches').insert({
    player1_id: player1Id,
    player2_id: player2Id,
    phase,
    series_id: seriesId,
    game_number: gameNumber,
    max_wins: maxWins,
    leg: 1,
  })
  if (error) throw error
}
