import { ErrorBoundary } from '@/components/ErrorBoundary'
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import { AuthProvider } from '@/context/AuthContext'
import { OnboardingProvider } from '@/context/OnboardingContext'
import { SubscriptionProvider } from '@/context/SubscriptionContext'
import '@/global.css'
import { Slot } from 'expo-router'
import { useEffect } from 'react'
import Purchases, { LOG_LEVEL } from 'react-native-purchases'

export default function RootLayout() {
  useEffect(() => {
    // Initialize RevenueCat
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE)
    Purchases.configure({ apiKey: 'appl_HzWQyORvJvHjlkmobZIlBHlbGqV' })
  }, [])

  return (
    <ErrorBoundary>
      <GluestackUIProvider mode="light">
        <AuthProvider>
          <OnboardingProvider>
            <SubscriptionProvider>
              <Slot />
            </SubscriptionProvider>
          </OnboardingProvider>
        </AuthProvider>
      </GluestackUIProvider>
    </ErrorBoundary>
  )
}
