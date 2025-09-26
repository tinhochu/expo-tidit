import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { Image } from 'expo-image'
import React from 'react'
import { View } from 'react-native'

interface PreAuthOnboardingStep4Props {
  data: any
  onUpdate: (data: any) => void
}

export default function PreAuthOnboardingStep4({}: PreAuthOnboardingStep4Props) {
  return (
    <VStack className="w-full flex-1">
      <View className="w-full flex-1">
        <Image
          source={require('@/assets/images/onboarding/4.jpg')}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>
    </VStack>
  )
}
