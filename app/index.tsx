import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { useSubscription } from '@/context/SubscriptionContext'
import { Redirect } from 'expo-router'
import React from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function Index() {
  const { session, loading, redirectPage } = useAuth()
  const { isLoading } = useOnboarding()
  const { isLoading: subscriptionLoading } = useSubscription()

  if (loading || isLoading || subscriptionLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  // If user is not authenticated, check redirectPage first
  if (!session) {
    if (redirectPage) {
      return <Redirect href={redirectPage} />
    }
    return <Redirect href="/signin" />
  }

  // If user is authenticated, redirect to app (the app layout will handle onboarding check)
  return <Redirect href="/(app)/(tabs)" />
}
