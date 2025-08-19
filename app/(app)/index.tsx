import MatchesList from '@/components/MatchesList'
import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Icon, SettingsIcon } from '@/components/ui/icon'
import { Pressable } from '@/components/ui/pressable'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'

interface Preferences {
  summonerId?: string
  [key: string]: any
}

export default function Index() {
  const scrollRef = useRef<ScrollView>(null)
  const { user, signout } = useAuth()
  const { userPreferences } = useOnboarding()
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

        const { data } = await response.json()
        setPreferences(data.preferences)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch preferences')
        console.error('Error fetching preferences:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPreferences()
  }, [user])

  const preferencesDisplay = useMemo(() => {
    if (!userPreferences) return null

    const hasSummoner = userPreferences?.summonerId

    return (
      <Box className="rounded-lg border border-gray-200 bg-white p-4">
        <Text size="lg" className="mb-2 font-semibold">
          Your Preferences:
        </Text>
        <Text>Experience: {JSON.stringify(userPreferences)}</Text>

        {hasSummoner ? (
          <Box className="mt-3 rounded-md bg-green-50 p-3">
            <Text className="font-medium text-green-800">✅ Connected to League of Legends</Text>
            <Text className="text-sm text-green-600">Summoner: {userPreferences.summonerId}</Text>
          </Box>
        ) : (
          <Box className="mt-3 rounded-md bg-blue-50 p-3">
            <Text className="font-medium text-blue-800">🔗 Connect Your League of Legends Account</Text>
            <Text className="text-sm text-blue-600">Search for your summoner to get started</Text>
            <Button onPress={() => router.push('/search-summoner')} size="sm" className="mt-2 bg-blue-500">
              <ButtonText>Search Summoner</ButtonText>
            </Button>
          </Box>
        )}
      </Box>
    )
  }, [userPreferences])

  // Redirect to search-summoner if no summoner is connected
  useEffect(() => {
    if (userPreferences && !userPreferences?.summonerId) {
      router.replace('/search-summoner')
    }
  }, [userPreferences])

  // Safety check for user object
  if (!user) return null

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} // iOS needs 'padding'
      keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })} // tweak if you have a header
    >
      <ScrollView
        ref={scrollRef}
        className="bg-orange-100"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <VStack className="justify-between" space="xl">
          <HStack className="items-center justify-between">
            <Heading size="2xl" className="text-black">
              Hello, {user.name || 'User'}!
            </Heading>

            <Pressable onPress={() => router.push('/settings')}>
              <Icon as={SettingsIcon} size="xl" />
            </Pressable>
          </HStack>

          <VStack space="xl">
            <HStack className="items-center justify-between">
              <Heading size="2xl">Dashboard</Heading>
              <Pressable onPress={() => router.push('/settings')}>
                <Icon as={SettingsIcon} size="xl" />
              </Pressable>
            </HStack>

            {error && (
              <Box className="rounded-lg border border-red-200 bg-red-50 p-4">
                <Text className="text-red-600">Error: {error}</Text>
              </Box>
            )}

            {loading && (
              <Box className="rounded-lg border border-gray-200 bg-white p-4">
                <Text>Loading preferences...</Text>
              </Box>
            )}

            {preferences?.summonerId ? (
              <MatchesList puuid={preferences?.summonerId ?? null} />
            ) : (
              <Box className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <Text className="mb-2 font-medium text-blue-800">No League of Legends Account Connected</Text>
                <Text className="mb-3 text-sm text-blue-600">
                  Connect your Riot account to view your match history and statistics.
                </Text>
                <Pressable onPress={() => router.push('/search-summoner')} className="rounded-lg bg-blue-500 px-4 py-2">
                  <Text className="font-medium text-white">Connect Account</Text>
                </Pressable>
              </Box>
            )}
          </VStack>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
