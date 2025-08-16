import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { ArrowLeftIcon, Icon } from '@/components/ui/icon'
import { Pressable } from '@/components/ui/pressable'
import { VStack } from '@/components/ui/vstack'
import { router } from 'expo-router'

export default function Settings() {
  return (
    <VStack className="justify-between" space="xl">
      <HStack className="items-center justify-start" space="xl">
        <Pressable onPress={() => router.back()}>
          <Icon as={ArrowLeftIcon} size="xl" />
        </Pressable>
        <Heading size="2xl" className="text-black">
          Settings
        </Heading>
      </HStack>
    </VStack>
  )
}
