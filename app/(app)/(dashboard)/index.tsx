import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'

interface Preferences {
  // Add specific preference fields based on your API response
  [key: string]: any
}

export default function Dashboard() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`https://zengamer-api.vercel.app/api/users/${user?.$id}/prefs`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.EXPO_PUBLIC_ZENGAMER_API_KEY!,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch preferences: ${response.status}`)
        }

        const data = await response.json()
        setPreferences(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch preferences')
        console.error('Error fetching preferences:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPreferences()
  }, [user])

  return (
    <VStack>
      <Heading>Dashboard</Heading>

      {loading && <Text>Loading preferences...</Text>}

      {error && <Text style={{ color: 'red' }}>Error: {error}</Text>}

      {preferences && (
        <VStack>
          <Heading size="md">Preferences</Heading>
          <Text>{JSON.stringify(preferences, null, 2)}</Text>
        </VStack>
      )}
    </VStack>
  )
}
