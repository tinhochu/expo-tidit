import { Button, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { useAuth } from '@/context/AuthContext'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Index() {
  const { user, session, signout } = useAuth()

  return (
    <SafeAreaView className="min-h-screen bg-orange-100 px-5">
      <VStack className="justify-between" space="lg">
        <Heading size="2xl" className="text-black">
          Hello {user.name}!
        </Heading>
        <Text size="lg" className="text-black">
          Welcome to ZenGamer
        </Text>
        <Button onPress={signout} size="xl" className="bg-red-500">
          <ButtonText>Logout</ButtonText>
        </Button>
      </VStack>
    </SafeAreaView>
  )
}
