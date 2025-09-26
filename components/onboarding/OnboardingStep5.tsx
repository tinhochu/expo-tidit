import { VStack } from '@/components/ui/vstack'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import React from 'react'
import { Pressable, View } from 'react-native'

interface PreAuthOnboardingStep5Props {
  data: any
  onUpdate: (data: any) => void
}

export default function PreAuthOnboardingStep5({}: PreAuthOnboardingStep5Props) {
  return (
    <VStack className="w-full flex-1">
      <View className="w-full flex-1">
        <Pressable onPress={() => router.push('/signin')}>
          <Image
            source={require('@/assets/images/onboarding/5.jpg')}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            alt="Onboarding step 5"
          />
        </Pressable>
      </View>
    </VStack>
  )
}
