import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { Redirect } from 'expo-router'
import React from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function Index() {
  const { session, loading, redirectPage } = useAuth()
  const { isLoading } = useOnboarding()

  if (loading || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  // If user is not authenticated, check redirectPage first
  if (!session) {
    if (redirectPage) {
      return <Redirect href={redirectPage} />
    }
    return <Redirect href="/onboarding" />
  }

  // If user is authenticated, redirect to app (the app layout will handle onboarding check)
  return <Redirect href="/(app)/(tabs)" />
}
