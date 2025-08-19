import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { useEffect, useState } from 'react'

interface MatchDetails {
  metadata: {
    matchId: string
    participants: string[]
  }
  info: {
    gameCreation: number
    gameDuration: number
    gameMode?: string
    participants: Array<{
      puuid: string
      summonerName: string
      championName: string
      kills: number
      deaths: number
      assists: number
      win: boolean
      teamId: number
      individualPosition: string
      champLevel: number
      totalMinionsKilled: number
      visionScore: number
      goldEarned: number
      totalDamageDealtToChampions: number
      totalDamageTaken: number
      timeCCingOthers: number
      totalTimeSpentDead: number
    }>
    teams: Array<{
      teamId: number
      win: boolean
    }>
  }
}

interface MatchCardProps {
  matchId: string
  game?: string
  currentUserPuuid?: string
}

export default function MatchCard({ matchId, game = 'lol', currentUserPuuid }: MatchCardProps) {
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`https://zengamer-api.vercel.app/api/${game}/match/${matchId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.EXPO_PUBLIC_ZENGAMER_API_KEY!,
          },
        })

        if (!response.ok) {
          console.log({ response: JSON.stringify(response, null, 2) })
          throw new Error(`Failed to fetch match details: ${response.status}`)
        }

        const responseData = await response.json()
        // Extract the match details from the nested data structure
        setMatchDetails(responseData.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch match details')
        console.error('Error fetching match details:', err)
      } finally {
        setLoading(false)
      }
    }

    if (matchId && game) {
      fetchMatchDetails()
    }
  }, [matchId, game])

  if (loading) {
    return (
      <Box className="rounded-lg border border-gray-200 bg-white p-4">
        <Text>Loading match details...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box className="rounded-lg border border-red-200 bg-red-50 p-4">
        <Text className="text-red-600">Error: {error}</Text>
      </Box>
    )
  }

  if (!matchDetails) {
    return (
      <Box className="rounded-lg border border-gray-200 bg-white p-4">
        <Text>No match details found.</Text>
      </Box>
    )
  }

  const formatGameDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  const formatGold = (gold: number) => {
    return gold.toLocaleString()
  }

  const formatDamage = (damage: number) => {
    return damage.toLocaleString()
  }

  // Find the current user's participant data
  const currentUserParticipant = currentUserPuuid
    ? matchDetails.info.participants.find((p) => p.puuid === currentUserPuuid)
    : null

  // Filter other participants (excluding current user)
  const otherParticipants = currentUserPuuid
    ? matchDetails.info.participants.filter((p) => p.puuid !== currentUserPuuid)
    : matchDetails.info.participants

  return (
    <Box className="rounded-lg border border-gray-200 bg-white p-4">
      <Text className="mb-2 text-lg font-semibold">Match {matchId}</Text>

      <Box className="space-y-2">
        <Text className="text-sm text-gray-600">Date: {formatDate(matchDetails.info.gameCreation)}</Text>
        <Text className="text-sm text-gray-600">Duration: {formatGameDuration(matchDetails.info.gameDuration)}</Text>

        <Box className="mt-4">
          <Text className="mb-2 font-medium">Match Summary:</Text>
          <Box className="grid grid-cols-2 gap-2 text-sm">
            <Text className="text-gray-600">Total Participants: {matchDetails.info.participants.length}</Text>
            <Text className="text-gray-600">Game Mode: {matchDetails.info.gameMode || 'Unknown'}</Text>
          </Box>
        </Box>

        <Box className="mt-4">
          <Text className="mb-2 font-medium">Team Results:</Text>
          <Box className="space-y-1">
            {matchDetails.info.teams.map((team, index) => (
              <Box key={index} className="flex items-center justify-between py-1">
                <Text className="text-sm">Team {team.teamId}</Text>
                <Text className={`text-sm font-medium ${team.win ? 'text-green-600' : 'text-red-600'}`}>
                  {team.win ? 'VICTORY' : 'DEFEAT'}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Show current user's performance prominently */}
        {currentUserParticipant && (
          <Box className="mt-4">
            <Text className="mb-2 font-medium text-blue-600">Your Performance:</Text>
            <Box className="rounded border-2 border-blue-200 bg-blue-50 p-3">
              <Box className="mb-2 flex items-start justify-between">
                <Text className="text-sm font-bold text-blue-800">
                  {currentUserParticipant.summonerName || 'You'} ({currentUserParticipant.championName})
                </Text>
                <Text
                  className={`rounded px-2 py-1 text-xs ${currentUserParticipant.win ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {currentUserParticipant.win ? 'WIN' : 'LOSS'}
                </Text>
              </Box>

              <Box className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                <Box>
                  <Text className="font-medium">Combat:</Text>
                  <Text>
                    KDA: {currentUserParticipant.kills}/{currentUserParticipant.deaths}/{currentUserParticipant.assists}
                  </Text>
                  <Text>Level: {currentUserParticipant.champLevel}</Text>
                  <Text>Position: {currentUserParticipant.individualPosition}</Text>
                </Box>
                <Box>
                  <Text className="font-medium">Stats:</Text>
                  <Text>CS: {currentUserParticipant.totalMinionsKilled}</Text>
                  <Text>Vision: {currentUserParticipant.visionScore}</Text>
                  <Text>Gold: {formatGold(currentUserParticipant.goldEarned)}</Text>
                </Box>
                <Box className="col-span-2">
                  <Text className="font-medium">Damage:</Text>
                  <Text>Dealt: {formatDamage(currentUserParticipant.totalDamageDealtToChampions)}</Text>
                  <Text>Taken: {formatDamage(currentUserParticipant.totalDamageTaken)}</Text>
                </Box>
                <Box className="col-span-2">
                  <Text className="font-medium">Other:</Text>
                  <Text>CC Time: {currentUserParticipant.timeCCingOthers}s</Text>
                  <Text>
                    Time Dead: {Math.floor(currentUserParticipant.totalTimeSpentDead / 60)}m{' '}
                    {currentUserParticipant.totalTimeSpentDead % 60}s
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Show other participants in a condensed format */}
        {otherParticipants.length > 0 && (
          <Box className="mt-4">
            <Text className="mb-2 font-medium text-gray-600">Other Players:</Text>
            <Box className="space-y-1">
              {otherParticipants.map((participant, index) => (
                <Box key={index} className="rounded border border-gray-100 bg-gray-50 p-2">
                  <Box className="flex items-center justify-between">
                    <Text className="text-xs font-medium">
                      {participant.summonerName || `Player ${index + 1}`} ({participant.championName})
                    </Text>
                    <Text
                      className={`rounded px-2 py-1 text-xs ${participant.win ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {participant.win ? 'WIN' : 'LOSS'}
                    </Text>
                  </Box>
                  <Box className="mt-1 flex justify-between text-xs text-gray-600">
                    <Text>
                      KDA: {participant.kills}/{participant.deaths}/{participant.assists}
                    </Text>
                    <Text>CS: {participant.totalMinionsKilled}</Text>
                    <Text>Gold: {formatGold(participant.goldEarned)}</Text>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}
