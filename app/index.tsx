import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { usePaywall } from '@/context/PaywallContext'
import { useSubscription } from '@/context/SubscriptionContext'
import { Redirect } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'

export default function Index() {
  const { session, loading, redirectPage } = useAuth()
  const { isLoading } = useOnboarding()
  const { shouldShowPaywall, markPaywallAsShown } = usePaywall()
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription()
  const [shouldRedirectToSubscription, setShouldRedirectToSubscription] = useState(false)

  useEffect(() => {
    if (shouldShowPaywall && !loading && !isLoading && !subscriptionLoading) {
      markPaywallAsShown()
      setShouldRedirectToSubscription(true)
    }
  }, [shouldShowPaywall, loading, isLoading, subscriptionLoading, markPaywallAsShown])

  if (loading || isLoading || subscriptionLoading) {
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
    return <Redirect href="/signin" />
  }

  // If user should see paywall and is not subscribed, redirect to subscription
  if (shouldRedirectToSubscription) {
    return <Redirect href="/subscription" />
  }

  // If user is authenticated, redirect to app (the app layout will handle onboarding check)
  return <Redirect href="/(app)/(tabs)" />
}
