import MatchCard from '@/components/match-card'
import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useEffect, useState } from 'react'

interface Match {
  metadata: {
    matchId: string
    participants: string[]
  }
  info: {
    gameCreation: number
    gameDuration: number
    participants: Array<{
      puuid: string
      summonerName: string
      championName: string
      kills: number
      deaths: number
      assists: number
      win: boolean
      teamId: number
    }>
    teams: Array<{
      teamId: number
      win: boolean
    }>
  }
}

interface MatchesListProps {
  puuid: string | null
}

export default function MatchesList({ puuid }: MatchesListProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [start, setStart] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const fetchMatches = async (startIndex: number, isLoadMore = false) => {
    if (!puuid) return

    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const response = await fetch(
        `https://zengamer-api.vercel.app/api/lol/matches/by-puuid/${puuid}?start=${startIndex}&count=5&type=`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.EXPO_PUBLIC_ZENGAMER_API_KEY!,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch matches: ${response.status}`)
      }

      const { data } = await response.json()

      if (isLoadMore) {
        setMatches((prev) => [...prev, ...data])
      } else {
        setMatches(data)
      }

      // Check if we have more matches to load
      setHasMore(data.length === 20)
      setStart(startIndex + data.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches')
      console.error('Error fetching matches:', err)
    } finally {
      if (isLoadMore) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchMatches(start, true)
    }
  }

  useEffect(() => {
    if (puuid) {
      fetchMatches(0)
    }
  }, [puuid])

  const formatGameDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  const getPlayerMatch = (match: Match) => {
    return match.info.participants.find((p) => p.puuid === puuid)
  }

  if (loading) {
    return (
      <Box className="rounded-lg border border-gray-200 bg-white p-4">
        <Text>Loading matches...</Text>
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

  if (matches.length === 0) {
    return (
      <Box className="rounded-lg border border-gray-200 bg-white p-4">
        <Text>No matches found.</Text>
      </Box>
    )
  }

  return (
    <VStack space="md">
      <Heading size="lg">Recent Matches</Heading>

      {matches.map((match: any) => {
        return <MatchCard key={match} matchId={match} currentUserPuuid={puuid || undefined} />
      })}

      {hasMore && (
        <Button onPress={loadMore} disabled={loadingMore} className="bg-blue-500">
          <ButtonText>{loadingMore ? 'Loading...' : 'Load More'}</ButtonText>
        </Button>
      )}
    </VStack>
  )
}
