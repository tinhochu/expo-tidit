import OnboardingCarousel from '@/components/OnboardingCarousel'
import OnboardingStep1 from '@/components/onboarding/OnboardingStep1'
import OnboardingStep2 from '@/components/onboarding/OnboardingStep2'
import OnboardingStep3 from '@/components/onboarding/OnboardingStep3'
import OnboardingStep4 from '@/components/onboarding/OnboardingStep4'
import OnboardingStep5 from '@/components/onboarding/OnboardingStep5'
import { useOnboarding } from '@/context/OnboardingContext'
import { useRouter } from 'expo-router'
import React from 'react'

const onboardingSteps = [
  {
    id: '1',
    component: <OnboardingStep1 data={{}} onUpdate={() => {}} />,
  },
  {
    id: '2',
    component: <OnboardingStep2 data={{}} onUpdate={() => {}} />,
  },
  {
    id: '3',
    component: <OnboardingStep3 data={{}} onUpdate={() => {}} />,
  },
  {
    id: '4',
    component: <OnboardingStep4 data={{}} onUpdate={() => {}} />,
  },
  {
    id: '5',
    component: <OnboardingStep5 data={{}} onUpdate={() => {}} />,
  },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const { completeOnboarding } = useOnboarding()

  const handleOnboardingComplete = async () => {
    await completeOnboarding()
    router.replace('/signin')
  }

  return <OnboardingCarousel steps={onboardingSteps} onComplete={handleOnboardingComplete} />
}
