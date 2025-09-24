import { ErrorBoundary } from '@/components/ErrorBoundary'
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import { AuthProvider } from '@/context/AuthContext'
import { OnboardingProvider } from '@/context/OnboardingContext'
import { SubscriptionProvider } from '@/context/SubscriptionContext'
import '@/global.css'
import { Slot } from 'expo-router'
import { PostHogProvider, usePostHog } from 'posthog-react-native'
import { useEffect } from 'react'
import Purchases, { LOG_LEVEL } from 'react-native-purchases'

export default function RootLayout() {
  useEffect(() => {
    // * Initialize RevenueCat
    Purchases.setLogLevel(LOG_LEVEL.ERROR)
    Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY! })
  }, [])

  return (
    <ErrorBoundary>
      <PostHogProvider
        // * the PostHog
        apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY!}
        autocapture
      >
        <GluestackUIProvider mode="light">
          <AuthProvider>
            <OnboardingProvider>
              <SubscriptionProvider>
                <Slot />
              </SubscriptionProvider>
            </OnboardingProvider>
          </AuthProvider>
        </GluestackUIProvider>
      </PostHogProvider>
    </ErrorBoundary>
  )
}
