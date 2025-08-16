import { Box } from '@/components/ui/box'
import { Button, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { useMemo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Index() {
  const { user, session, signout } = useAuth()
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
  if (!user) {
    return null
  }

  return (
    <SafeAreaView className="min-h-screen bg-orange-100 px-5">
      <VStack className="justify-between" space="xl">
        <Heading size="2xl" className="text-black">
          Hello, {user.name || 'User'}!
        </Heading>
        <Text size="lg" className="text-black">
          Welcome to ZenGamer
        </Text>

        {preferencesDisplay}

        <Button onPress={signout} size="xl" className="bg-red-500">
          <ButtonText>Sign Out</ButtonText>
        </Button>
      </VStack>
    </SafeAreaView>
  )
}
