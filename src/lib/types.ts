export type GroupName = 'A' | 'B'
export type Phase = 'group' | 'semi' | 'barrage' | 'final'

export interface Player {
  id: string
  name: string
  group_name: GroupName
  entreprise: string | null
}

export interface Match {
  id: string
  player1_id: string
  player2_id: string
  player1_sets: number | null
  player2_sets: number | null
  phase: Phase
  group_name: GroupName | null
  leg: number
  series_id: string | null
  game_number: number
  max_wins: number | null
  is_played: boolean
  played_at: string | null
  created_at: string
  scheduled_at: string | null
  scheduled_by: string | null
  schedule_confirmed: boolean
  // Joined fields
  player1?: Player
  player2?: Player
}

export interface PlayerStats {
  player: Player
  played: number
  won: number
  lost: number
  points: number
  sets_won: number
  sets_lost: number
  set_diff: number
  rank?: number
}

export interface PlayoffSeries {
  series_id: string
  phase: Phase
  player1: Player
  player2: Player
  player1_wins: number
  player2_wins: number
  max_wins: number
  games: Match[]
  winner?: Player
  is_complete: boolean
}
