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
import { useMemo } from 'react'

export default function Index() {
  const { user, signout } = useAuth()
  const { userPreferences } = useOnboarding()

  const preferencesDisplay = useMemo(() => {
    if (!userPreferences) return null

    return (
      <Box className="rounded-lg border border-gray-200 bg-white p-4">
        <Text size="lg" className="mb-2 font-semibold">
          Your Preferences:
        </Text>
        <Text>Experience: {JSON.stringify(userPreferences)}</Text>
      </Box>
    )
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
