import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { Image } from 'expo-image'
import React from 'react'
import { View } from 'react-native'

interface PreAuthOnboardingStep2Props {
  data: any
  onUpdate: (data: any) => void
}

export default function PreAuthOnboardingStep2({}: PreAuthOnboardingStep2Props) {
  return (
    <VStack className="w-full flex-1">
      <HStack className="w-full flex-1">
        <View className="flex-1">
          <Image
            source={require('@/assets/images/onboarding/2.jpg')}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            alt="Onboarding step 2"
          />
        </View>
      </HStack>
    </VStack>
  )
}
