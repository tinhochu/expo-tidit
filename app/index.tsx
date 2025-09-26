import { useOnboarding } from '@/context/OnboardingContext'
import { Redirect } from 'expo-router'
import React from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function Index() {
  const { hasSeenOnboarding, isLoading } = useOnboarding()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />
  }

  return <Redirect href="/" />
}
