import { VStack } from '@/components/ui/vstack'
import { Image } from 'expo-image'
import React from 'react'

interface PreAuthOnboardingStep1Props {
  data: any
  onUpdate: (data: any) => void
}

export default function PreAuthOnboardingStep1({}: PreAuthOnboardingStep1Props) {
  return (
    <VStack className="w-full flex-1">
      <Image
        source={require('@/assets/images/onboarding/1.jpg')}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
      />
    </VStack>
  )
}
