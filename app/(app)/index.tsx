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
import { useEffect, useMemo } from 'react'

export default function Index() {
  const { user, signout } = useAuth()
  const { userPreferences } = useOnboarding()

  const preferencesDisplay = useMemo(() => {
    if (!userPreferences) return null

    const hasSummoner = userPreferences.summoner?.puuid

    return (
      <Box className="rounded-lg border border-gray-200 bg-white p-4">
        <Text size="lg" className="mb-2 font-semibold">
          Your Preferences:
        </Text>
        <Text>Experience: {JSON.stringify(userPreferences)}</Text>

        {hasSummoner ? (
          <Box className="mt-3 rounded-md bg-green-50 p-3">
            <Text className="font-medium text-green-800">✅ Connected to League of Legends</Text>
            <Text className="text-sm text-green-600">
              Summoner: {userPreferences.summoner?.summonerName} ({userPreferences.summoner?.region})
            </Text>
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
    if (userPreferences && !userPreferences.summoner?.puuid) {
      router.replace('/search-summoner')
    }
  }, [userPreferences])

  // Safety check for user object
  if (!user) return null

  return (
    <VStack className="justify-between" space="xl">
      <HStack className="items-center justify-between">
        <Heading size="2xl" className="text-black">
          Hello, {user.name || 'User'}!
        </Heading>

        <Pressable onPress={() => router.push('/settings')}>
          <Icon as={SettingsIcon} size="xl" />
        </Pressable>
      </HStack>
      <Text size="lg" className="text-black">
        Welcome to ZenGamer
      </Text>

      {preferencesDisplay}

      <Button onPress={signout} size="xl" className="bg-red-500">
        <ButtonText>Sign Out</ButtonText>
      </Button>
    </VStack>
  )
}
