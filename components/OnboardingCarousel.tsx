import { Text } from '@/components/ui/text'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Dimensions, ScrollView, View } from 'react-native'

const { width: screenWidth } = Dimensions.get('window')

interface OnboardingStep {
  id: string
  component?: React.ReactNode
}

interface OnboardingCarouselProps {
  steps: OnboardingStep[]
  onComplete: (data: any) => void
}

export default function OnboardingCarousel({ steps, onComplete }: OnboardingCarouselProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const router = useRouter()

  const handleStepChange = (index: number) => {
    setCurrentStep(index)
  }

  return (
    <View className="flex-1">
      {/* Carousel content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true} // Enable manual scrolling/swiping
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
          handleStepChange(index)
        }}
      >
        {steps.map((step, index: number) => (
          <View key={step.id} style={{ width: screenWidth, flex: 1 }}>
            {step.component}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
